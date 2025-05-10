#!/usr/bin/env python

"""
Custom Django server script that runs on port 8000 (Django's default port).
"""

import os
import sys

def main():
    """Run Django server on port 8000"""
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'smart_note_organizer.settings')
    
    try:
        from django.core.management import execute_from_command_line
    except ImportError as exc:
        raise ImportError(
            "Couldn't import Django. Are you sure it's installed?"
        ) from exc
        
    # Run on port 8000
    sys.argv = [sys.argv[0], 'runserver', '0.0.0.0:8000']
    execute_from_command_line(sys.argv)

if __name__ == '__main__':
    main() 