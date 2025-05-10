import re
from datetime import datetime

# Function to extract timestamp from log entry
def extract_timestamp(log_entry):
    match = re.search(r'\d{4}-\d{2}-\d{2}_\d{2}:\d{2}:\d{2}', log_entry)
    if match:
        timestamp_str = match.group(0)
        return datetime.strptime(timestamp_str, '%Y-%m-%d_%H:%M:%S')
    return None

# Function to merge log files based on timestamp
def merge_logs(log_files, output_file):
    all_entries = []

    # Read log entries from each file
    for file_path in log_files:
        with open(file_path, 'r') as file:
            log_entries = file.readlines()
            all_entries.extend(log_entries)

    # Sort log entries by timestamp
    sorted_entries = sorted(all_entries, key=lambda entry: extract_timestamp(entry))

    # Write sorted entries to output file
    with open(output_file, 'w') as outfile:
        outfile.writelines(sorted_entries)

# List of log files to merge
log_files = ['openstack_abnormal.log', 'openstack_normal1.log']

# Output file path for merged log
output_file = 'merged_openstack_logs.txt'

# Merge log files
merge_logs(log_files, output_file)

print(f"Merged log file saved to {output_file}")