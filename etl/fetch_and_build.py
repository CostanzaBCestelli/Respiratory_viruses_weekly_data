#!/usr/bin/env python3
"""
ETL pipeline for respiratory virus surveillance data.

Fetches data from ECDC ERVISS (European Respiratory Virus Surveillance System),
validates schemas, transforms to JSONL format, and writes output files.

Usage:
    python fetch_and_build.py --mock     # Generate mock data
    python fetch_and_build.py --real     # Fetch real data from ECDC GitHub

Environment Variables (for --real mode):
    ECDC_CSV_URL: URL to ECDC ERVISS weekly CSV (optional, uses default if not set)
"""

import argparse
import csv
import datetime
import hashlib
import json
import os
import re
import sys
import tempfile
from io import StringIO
from pathlib import Path
from typing import Any, Dict, List, Optional
from urllib.request import Request, urlopen
from urllib.error import URLError, HTTPError


# Constants
DATA_DIR = Path(__file__).parent.parent / "data"
ISO_WEEK_FORMAT = "%Y-W%W"
ISO_WEEK_PATTERN = re.compile(r'^\d{4}-W\d{2}$')

# Default data source URLs (can be overridden with environment variables)
DEFAULT_ECDC_URL = "https://raw.githubusercontent.com/EU-ECDC/Respiratory_viruses_weekly_data/main/data/sentinelTestsDetectionsPositivity.csv"


def fetch_csv_text(url: str, timeout: int = 30) -> str:
    """
    Fetch CSV content from a URL.

    Args:
        url: The URL to fetch from
        timeout: Request timeout in seconds

    Returns:
        CSV content as string

    Raises:
        URLError: If the request fails
        HTTPError: If the server returns an error status
    """
    try:
        req = Request(url, headers={
            'User-Agent': 'Mozilla/5.0 (respiratory-virus-dashboard/1.0)',
        })
        with urlopen(req, timeout=timeout) as response:
            content = response.read().decode('utf-8')
            return content
    except (URLError, HTTPError) as e:
        print(f"ERROR: Failed to fetch {url}: {e}", file=sys.stderr)
        raise


def parse_iso_week(date_str: str) -> str:
    """
    Parse a date string and return ISO week format (YYYY-Www).

    Args:
        date_str: Date string in format YYYY-MM-DD or similar

    Returns:
        ISO week string in format YYYY-Www

    Raises:
        ValueError: If date string cannot be parsed
    """
    try:
        # Try common date formats
        for fmt in ["%Y-%m-%d", "%Y/%m/%d", "%d/%m/%Y", "%d-%m-%Y"]:
            try:
                date_obj = datetime.datetime.strptime(date_str, fmt)
                iso_year, iso_week, _ = date_obj.isocalendar()
                return f"{iso_year}-W{iso_week:02d}"
            except ValueError:
                continue
        raise ValueError(f"Could not parse date: {date_str}")
    except Exception as e:
        print(f"ERROR: Date parsing failed for '{date_str}': {e}", file=sys.stderr)
        raise


def validate_required_columns(headers: List[str], required: List[str], source_name: str) -> None:
    """
    Validate that all required columns are present in CSV headers.

    Args:
        headers: List of column names from CSV
        required: List of required column names
        source_name: Name of data source for error messages

    Raises:
        ValueError: If required columns are missing
    """
    headers_lower = [h.lower().strip() for h in headers]
    missing = []
    for col in required:
        if col.lower() not in headers_lower:
            missing.append(col)
    
    if missing:
        raise ValueError(
            f"{source_name} schema validation failed. Missing columns: {missing}. "
            f"Found columns: {headers}"
        )


def build_ecdc_weekly(csv_text: str) -> List[Dict[str, Any]]:
    """
    Parse ECDC ERVISS CSV and build weekly JSONL records.

    Expected columns (actual ECDC format):
    - survtype: surveillance type (e.g., 'primary care sentinel')
    - countryname: country name
    - yearweek: ISO week format (YYYY-Www)
    - pathogen: pathogen name (Influenza, RSV, SARS-CoV-2)
    - indicator: metric type (positivity, detections, tests)
    - value: numeric value

    Args:
        csv_text: CSV content as string

    Returns:
        List of dictionaries with standardized schema

    Raises:
        ValueError: If required columns are missing or data is invalid
    """
    reader = csv.DictReader(StringIO(csv_text))
    
    if reader.fieldnames is None:
        raise ValueError("ECDC CSV has no headers")
    
    # Map flexible column names to standard names
    header_map = {}
    headers_lower = {h.lower().strip(): h for h in reader.fieldnames}
    
    # Country - check for 'countryname' or alternatives
    for variant in ['countryname', 'country_name', 'country', 'countrycode']:
        if variant in headers_lower:
            header_map['country'] = headers_lower[variant]
            break
    
    # Pathogen
    for variant in ['pathogen', 'virus', 'organism']:
        if variant in headers_lower:
            header_map['pathogen'] = headers_lower[variant]
            break
    
    # Week - ECDC uses 'yearweek'
    for variant in ['yearweek', 'year_week', 'iso_week', 'week', 'date']:
        if variant in headers_lower:
            header_map['yearweek'] = headers_lower[variant]
            break
    
    # Indicator (metric type)
    for variant in ['indicator', 'metric', 'measure']:
        if variant in headers_lower:
            header_map['indicator'] = headers_lower[variant]
            break
    
    # Value
    for variant in ['value', 'val', 'number']:
        if variant in headers_lower:
            header_map['value'] = headers_lower[variant]
            break
    
    # Check required fields
    if 'country' not in header_map:
        raise ValueError(f"ECDC CSV missing country column. Headers: {list(reader.fieldnames)}")
    if 'pathogen' not in header_map:
        raise ValueError(f"ECDC CSV missing pathogen column. Headers: {list(reader.fieldnames)}")
    if 'yearweek' not in header_map:
        raise ValueError(f"ECDC CSV missing yearweek column. Headers: {list(reader.fieldnames)}")
    if 'indicator' not in header_map:
        raise ValueError(f"ECDC CSV missing indicator column. Headers: {list(reader.fieldnames)}")
    if 'value' not in header_map:
        raise ValueError(f"ECDC CSV missing value column. Headers: {list(reader.fieldnames)}")
    
    results = []
    for row in reader:
        # Filter to Italy only
        country = row[header_map['country']].strip()
        if country.upper() not in ['IT', 'ITA', 'ITALY']:
            continue
        
        # Get pathogen and normalize
        pathogen_raw = row[header_map['pathogen']].strip()
        
        # Normalize pathogen names
        pathogen_lower = pathogen_raw.lower()
        if 'influenza' in pathogen_lower:
            pathogen = 'influenza'
        elif 'rsv' in pathogen_lower or 'respiratory syncytial' in pathogen_lower:
            pathogen = 'RSV'
        elif 'covid' in pathogen_lower or 'sars' in pathogen_lower or 'cov-2' in pathogen_lower:
            pathogen = 'SARS-CoV-2'
        else:
            pathogen = pathogen_raw
        
        # Get ISO week (already in correct format from ECDC)
        iso_week = row[header_map['yearweek']].strip()
        if not iso_week or not ISO_WEEK_PATTERN.match(iso_week):
            continue
        
        # Get indicator and normalize
        indicator = row[header_map['indicator']].strip().lower()
        
        # Map ECDC indicators to our standard metrics
        if indicator == 'positivity':
            metric = 'positivity_rate'
        elif indicator == 'detections':
            metric = 'cases'
        elif indicator == 'tests':
            metric = 'tests'
        elif 'positivity' in indicator or 'percent' in indicator:
            metric = 'positivity_rate'
        elif 'detection' in indicator or 'case' in indicator or 'positive' in indicator:
            metric = 'cases'
        elif 'test' in indicator or 'specimen' in indicator:
            metric = 'tests'
        else:
            # Skip unknown indicators
            continue
        
        # Get value
        val_str = row[header_map['value']].strip()
        if not val_str or val_str in ['', 'NA', 'N/A', 'null', 'None']:
            continue
        
        try:
            value = float(val_str)
            if value < 0:
                continue
            if metric == 'positivity_rate' and value > 100:
                continue
        except (ValueError, TypeError):
            continue
        
        # Create record
        results.append({
            'source': 'ECDC',
            'iso_week': iso_week,
            'country': 'IT',
            'pathogen': pathogen,
            'metric': metric,
            'value': value
        })
    
    if not results:
        print("WARNING: No ECDC records extracted for Italy", file=sys.stderr)
    
    return results




def compute_content_hash(records: List[Dict[str, Any]]) -> str:
    """
    Compute a hash of the record content for change detection.

    Args:
        records: List of data records

    Returns:
        SHA256 hash of the serialized content
    """
    content = json.dumps(records, sort_keys=True, ensure_ascii=False)
    return hashlib.sha256(content.encode('utf-8')).hexdigest()


def write_jsonl(path: Path, records: List[Dict[str, Any]]) -> bool:
    """
    Write records to JSONL file atomically with change detection.

    Args:
        path: Output file path
        records: List of dictionaries to write

    Returns:
        True if file was written (new or changed), False if unchanged

    Raises:
        IOError: If write fails
    """
    # Check if content has changed
    new_hash = compute_content_hash(records)
    
    if path.exists():
        with open(path, 'r', encoding='utf-8') as f:
            existing_records = [json.loads(line) for line in f if line.strip()]
            existing_hash = compute_content_hash(existing_records)
            
            if existing_hash == new_hash:
                print(f"INFO: {path.name} unchanged, skipping write")
                return False
    
    # Write atomically using temp file
    path.parent.mkdir(parents=True, exist_ok=True)
    
    with tempfile.NamedTemporaryFile(
        mode='w',
        encoding='utf-8',
        delete=False,
        dir=path.parent,
        prefix=f".{path.name}.",
        suffix='.tmp'
    ) as tmp:
        for record in records:
            json.dump(record, tmp, ensure_ascii=False)
            tmp.write('\n')
        tmp_path = tmp.name
    
    # Atomic rename
    os.replace(tmp_path, path)
    print(f"INFO: Wrote {len(records)} records to {path}")
    return True


def generate_mock_ecdc_data() -> List[Dict[str, Any]]:
    """Generate mock ECDC data for testing."""
    results = []
    base_date = datetime.date.today()
    
    for weeks_ago in range(52, 0, -1):
        week_date = base_date - datetime.timedelta(weeks=weeks_ago)
        iso_year, iso_week, _ = week_date.isocalendar()
        iso_week_str = f"{iso_year}-W{iso_week:02d}"
        
        # Mock influenza data
        results.append({
            'source': 'ECDC',
            'iso_week': iso_week_str,
            'country': 'IT',
            'pathogen': 'influenza',
            'metric': 'positivity_rate',
            'value': 5.0 + (weeks_ago % 10) * 2.5
        })
        
        # Mock RSV data
        results.append({
            'source': 'ECDC',
            'iso_week': iso_week_str,
            'country': 'IT',
            'pathogen': 'RSV',
            'metric': 'cases',
            'value': 50.0 + (weeks_ago % 15) * 10.0
        })
    
    return results




def main() -> int:
    """
    Main ETL entry point.

    Returns:
        Exit code (0 for success, non-zero for failure)
    """
    parser = argparse.ArgumentParser(
        description='Fetch and process respiratory virus surveillance data'
    )
    parser.add_argument(
        '--mock',
        action='store_true',
        help='Generate mock data instead of fetching real sources'
    )
    parser.add_argument(
        '--real',
        action='store_true',
        help='Fetch real data from sources (requires env vars)'
    )
    
    args = parser.parse_args()
    
    if not args.mock and not args.real:
        parser.error("Must specify either --mock or --real")
    
    if args.mock and args.real:
        parser.error("Cannot specify both --mock and --real")
    
    try:
        if args.mock:
            print("INFO: Generating mock data...")
            ecdc_records = generate_mock_ecdc_data()
        else:
            # Get URL from environment or use default
            ecdc_url = os.environ.get('ECDC_CSV_URL', DEFAULT_ECDC_URL)
            
            print(f"INFO: Fetching ECDC data from {ecdc_url}")
            try:
                ecdc_csv = fetch_csv_text(ecdc_url)
                ecdc_records = build_ecdc_weekly(ecdc_csv)
            except Exception as e:
                print(f"ERROR: Failed to fetch/parse ECDC data: {e}", file=sys.stderr)
                return 1
        
        # Write output file
        ecdc_path = DATA_DIR / "ecdc_weekly.jsonl"
        
        ecdc_changed = write_jsonl(ecdc_path, ecdc_records)
        
        if ecdc_changed:
            print("INFO: Data files updated successfully")
            return 0
        else:
            print("INFO: No changes detected in data")
            return 0
    
    except Exception as e:
        print(f"ERROR: ETL pipeline failed: {e}", file=sys.stderr)
        import traceback
        traceback.print_exc()
        return 1


if __name__ == '__main__':
    sys.exit(main())


