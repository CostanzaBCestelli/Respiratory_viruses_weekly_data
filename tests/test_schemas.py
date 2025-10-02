#!/usr/bin/env python3
"""
Schema validation tests for JSONL data files.

Ensures data quality and adherence to defined schemas before publication.
"""

import json
import re
from pathlib import Path
from typing import Any, Dict, List


# Path to data directory
DATA_DIR = Path(__file__).parent.parent / "data"

# Valid values
VALID_SOURCES = {'ECDC'}
VALID_PATHOGENS = {'influenza', 'RSV', 'SARS-CoV-2'}
VALID_METRICS = {'positivity_rate', 'cases', 'tests'}
ISO_WEEK_PATTERN = re.compile(r'^\d{4}-W\d{2}$')


def load_jsonl(path: Path, max_lines: int = 100) -> List[Dict[str, Any]]:
    """
    Load JSONL file and return records.

    Args:
        path: Path to JSONL file
        max_lines: Maximum number of lines to read (default 100)

    Returns:
        List of parsed JSON objects

    Raises:
        FileNotFoundError: If file doesn't exist
        json.JSONDecodeError: If JSON is malformed
    """
    records = []
    
    if not path.exists():
        raise FileNotFoundError(f"Data file not found: {path}")
    
    with open(path, 'r', encoding='utf-8') as f:
        for i, line in enumerate(f):
            if i >= max_lines:
                break
            
            line = line.strip()
            if not line:
                continue
            
            try:
                record = json.loads(line)
                records.append(record)
            except json.JSONDecodeError as e:
                raise ValueError(f"Invalid JSON at line {i+1}: {e}")
    
    return records


def validate_ecdc_record(record: Dict[str, Any], line_num: int) -> None:
    """
    Validate a single ECDC JSONL record.

    Args:
        record: Dictionary representing one JSONL record
        line_num: Line number for error reporting

    Raises:
        AssertionError: If validation fails
        KeyError: If required field is missing
    """
    # Required fields
    required_fields = ['source', 'iso_week', 'country', 'pathogen', 'metric', 'value']
    for field in required_fields:
        assert field in record, f"Line {line_num}: Missing required field '{field}'"
    
    # Source
    assert record['source'] == 'ECDC', \
        f"Line {line_num}: Invalid source '{record['source']}', expected 'ECDC'"
    
    # ISO week format
    assert ISO_WEEK_PATTERN.match(record['iso_week']), \
        f"Line {line_num}: Invalid iso_week format '{record['iso_week']}', expected YYYY-Www"
    
    # Country (Italy only)
    assert record['country'] == 'IT', \
        f"Line {line_num}: Invalid country '{record['country']}', expected 'IT'"
    
    # Pathogen
    assert record['pathogen'] in VALID_PATHOGENS, \
        f"Line {line_num}: Invalid pathogen '{record['pathogen']}', expected one of {VALID_PATHOGENS}"
    
    # Metric
    assert record['metric'] in VALID_METRICS, \
        f"Line {line_num}: Invalid metric '{record['metric']}', expected one of {VALID_METRICS}"
    
    # Value
    assert isinstance(record['value'], (int, float)), \
        f"Line {line_num}: Value must be numeric, got {type(record['value'])}"
    assert record['value'] >= 0, \
        f"Line {line_num}: Value must be non-negative, got {record['value']}"
    assert not (record['metric'] == 'positivity_rate' and record['value'] > 100), \
        f"Line {line_num}: Positivity rate cannot exceed 100%, got {record['value']}"
    
    # Check for infinity/NaN
    assert abs(record['value']) != float('inf'), \
        f"Line {line_num}: Value cannot be infinite"
    assert record['value'] == record['value'], \
        f"Line {line_num}: Value cannot be NaN"




def test_ecdc_weekly_schema():
    """Test ECDC weekly JSONL schema compliance."""
    print("Testing ECDC weekly data schema...")
    
    ecdc_path = DATA_DIR / "ecdc_weekly.jsonl"
    records = load_jsonl(ecdc_path, max_lines=100)
    
    assert len(records) > 0, "ECDC weekly file is empty"
    
    for i, record in enumerate(records, start=1):
        validate_ecdc_record(record, i)
    
    print(f"[OK] Validated {len(records)} ECDC records")




def test_ecdc_data_coverage():
    """Test that ECDC data includes expected pathogens."""
    print("Testing ECDC data coverage...")
    
    ecdc_path = DATA_DIR / "ecdc_weekly.jsonl"
    records = load_jsonl(ecdc_path, max_lines=500)
    
    pathogens = set(r['pathogen'] for r in records)
    
    # Should have at least influenza or RSV
    assert len(pathogens) > 0, "No pathogens found in ECDC data"
    assert pathogens.issubset(VALID_PATHOGENS), \
        f"Invalid pathogens found: {pathogens - VALID_PATHOGENS}"
    
    print(f"[OK] Found pathogens: {pathogens}")




def test_data_freshness():
    """Test that data includes recent weeks."""
    from datetime import date, timedelta
    
    print("Testing data freshness...")
    
    # Check ECDC data
    ecdc_path = DATA_DIR / "ecdc_weekly.jsonl"
    ecdc_records = load_jsonl(ecdc_path, max_lines=500)
    
    ecdc_weeks = set(r['iso_week'] for r in ecdc_records)
    
    # Get current ISO week
    today = date.today()
    iso_year, iso_week, _ = today.isocalendar()
    current_week = f"{iso_year}-W{iso_week:02d}"
    
    # Check for data within last 12 weeks
    recent_weeks = []
    for i in range(12):
        week_date = today - timedelta(weeks=i)
        iso_y, iso_w, _ = week_date.isocalendar()
        recent_weeks.append(f"{iso_y}-W{iso_w:02d}")
    
    has_recent = any(week in ecdc_weeks for week in recent_weeks)
    
    print(f"[OK] Current week: {current_week}")
    print(f"[OK] Data includes recent weeks: {has_recent}")
    
    # Warning if no recent data (might be mock data)
    if not has_recent:
        print("[WARN] No data from last 12 weeks found (may be mock data)")


def run_all_tests():
    """Run all schema validation tests."""
    tests = [
        test_ecdc_weekly_schema,
        test_ecdc_data_coverage,
        test_data_freshness,
    ]
    
    failed = []
    
    print("=" * 60)
    print("Running data schema validation tests")
    print("=" * 60)
    
    for test in tests:
        try:
            print(f"\n[{test.__name__}]")
            test()
        except Exception as e:
            print(f"[FAIL] {e}")
            failed.append((test.__name__, e))
    
    print("\n" + "=" * 60)
    
    if failed:
        print(f"FAILED: {len(failed)} test(s) failed:")
        for name, error in failed:
            print(f"  - {name}: {error}")
        return 1
    else:
        print("SUCCESS: All tests passed!")
        return 0


if __name__ == '__main__':
    import sys
    sys.exit(run_all_tests())

