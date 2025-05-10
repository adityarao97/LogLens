import re
import mysql.connector
from datetime import datetime

# --- Configuration ---
DB_HOST        = 'mydb-instance.c36ok0iyywfv.us-west-1.rds.amazonaws.com'
DB_USER        = 'admin'
DB_PASSWORD    = 'Aditya87Password'
DB_NAME        = 'log_db'

MERGED_LOG_FILE = 'merged_openstack_logs.txt'
QUERY_LOG_FILE  = 'inserted_queries.log'

# --- Regex Patterns ---

# 2a) HTTP-style entries
pattern_http = re.compile(
    r'^(?P<log_file>[\w\.-]+)\.(?P<raw_ts>\d{4}-\d{2}-\d{2}_\d{2}:\d{2}:\d{2}) '
    r'\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\.\d+ \d+ '
    r'(?P<log_level>\w+) (?P<log_module>[\w\.-]+) '
    r'\[req-(?P<log_request_id>[\w-]+)\s+(?P<log_user_id>[\w-]+)[^\]]*\]\s+'
    r'(?P<log_ip_address>[\d\.]+)\s+'
    r'"(?P<log_request_method>\w+)\s+(?P<log_request_url>\S+)\s+(?P<log_protocol>[\w/\.]+)"\s+'
    r'status:\s*(?P<log_status>\d+)\s+len:\s*(?P<log_length>\d+)\s+time:\s*(?P<log_time>[\d\.]+)'
)

# 2b) Non-HTTP entries (capture trailing message)
pattern_error = re.compile(
    r'^(?P<log_file>[\w\.-]+)\.(?P<raw_ts>\d{4}-\d{2}-\d{2}_\d{2}:\d{2}:\d{2}) '
    r'\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\.\d+ \d+ '
    r'(?P<log_level>\w+) (?P<log_module>[\w\.-]+) '
    r'\[req-(?P<log_request_id>[\w-]+)\s+(?P<log_user_id>[\w-]+)[^\]]*\]\s*'
    r'(?P<message>.+)$'
)

# --- Parser ---
def parse_log_entry(line):
    # Try HTTP pattern first
    m = pattern_http.match(line)
    if m:
        d = m.groupdict()
        # Convert types
        d['log_timestamp'] = datetime.strptime(d.pop('raw_ts'), '%Y-%m-%d_%H:%M:%S')
        d['log_status']    = int(d['log_status'])
        d['log_length']    = int(d['log_length'])
        d['log_time']      = float(d['log_time'])
        d['message']       = None
        return d

    # Then try error pattern
    m2 = pattern_error.match(line)
    if m2:
        d = m2.groupdict()
        d['log_timestamp']   = datetime.strptime(d.pop('raw_ts'), '%Y-%m-%d_%H:%M:%S')
        # No HTTP fields
        d['log_ip_address']     = None
        d['log_request_method'] = None
        d['log_request_url']    = None
        d['log_protocol']       = None
        d['log_status']         = None
        d['log_length']         = None
        d['log_time']           = None
        return d

    # If neither matched, skip
    return None

# --- Literal‐SQL Escaping Helper ---
def format_sql_literal(val):
    if val is None:
        return 'NULL'
    s = str(val).replace("'", "''")
    return f"'{s}'"

# --- Main Insert Loop ---
def main():
    conn = mysql.connector.connect(
        host=DB_HOST, user=DB_USER,
        password=DB_PASSWORD, database=DB_NAME
    )
    cursor = conn.cursor()

    # Clear previous query log
    open(QUERY_LOG_FILE, 'w').close()

    # Prepared INSERT
    insert_sql = """
      INSERT INTO logs
        (log_file, log_timestamp, log_level, log_module,
         log_request_id, log_user_id, log_ip_address,
         log_request_method, log_request_url, log_protocol,
         log_status, log_length, log_time, message)
      VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
    """

    # Columns for literal logging
    cols = ", ".join([
        "log_file", "log_timestamp", "log_level", "log_module",
        "log_request_id", "log_user_id", "log_ip_address",
        "log_request_method", "log_request_url", "log_protocol",
        "log_status", "log_length", "log_time", "message"
    ])

    with open(MERGED_LOG_FILE, 'r') as infile:
        for line in infile:
            entry = parse_log_entry(line.strip())
            if not entry:
                continue

            params = (
                entry['log_file'],
                entry['log_timestamp'],
                entry['log_level'],
                entry['log_module'],
                entry['log_request_id'],
                entry['log_user_id'],
                entry['log_ip_address'],
                entry['log_request_method'],
                entry['log_request_url'],
                entry['log_protocol'],
                entry['log_status'],
                entry['log_length'],
                entry['log_time'],
                entry['message']
            )

            # Build literal SQL for auditing
            lits = ", ".join([
                format_sql_literal(entry['log_file']),
                format_sql_literal(entry['log_timestamp'].strftime('%Y-%m-%d %H:%M:%S')),
                format_sql_literal(entry['log_level']),
                format_sql_literal(entry['log_module']),
                format_sql_literal(entry['log_request_id']),
                format_sql_literal(entry['log_user_id']),
                format_sql_literal(entry['log_ip_address']),
                format_sql_literal(entry['log_request_method']),
                format_sql_literal(entry['log_request_url']),
                format_sql_literal(entry['log_protocol']),
                format_sql_literal(entry['log_status']),
                format_sql_literal(entry['log_length']),
                format_sql_literal(entry['log_time']),
                format_sql_literal(entry['message'])
            ])
            literal_sql = f"INSERT INTO logs ({cols}) VALUES ({lits});"
            with open(QUERY_LOG_FILE, 'a') as qlog:
                qlog.write(literal_sql + "\n")

            # Execute the parameterized insert
            cursor.execute(insert_sql, params)

    conn.commit()
    cursor.close()
    conn.close()
    print("All lines—including error‐only entries—have been inserted.")

if __name__ == "__main__":
    main()
