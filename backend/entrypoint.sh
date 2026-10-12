#!/bin/sh
# Render provides DATABASE_URL as:
#   postgresql://user:pass@host:port/db  OR  postgresql://user:pass@host/db
# PostgreSQL JDBC driver does NOT support user:pass@ embedded in URL
# So we extract each part and pass them as separate Spring properties

if [ -n "$DATABASE_URL" ]; then
  # Remove scheme prefix (postgres:// or postgresql://)
  WITHOUT_SCHEME="${DATABASE_URL#postgres://}"
  WITHOUT_SCHEME="${WITHOUT_SCHEME#postgresql://}"

  # Split user:pass from host/db
  USERINFO="${WITHOUT_SCHEME%@*}"    # everything before last @
  HOSTINFO="${WITHOUT_SCHEME#*@}"    # everything after last @

  # Extract username and password
  DB_USER="${USERINFO%:*}"
  DB_PASS="${USERINFO#*:}"

  # Extract host:port and database name
  HOST_AND_PORT="${HOSTINFO%%/*}"    # host:port or just host
  DB_NAME="${HOSTINFO#*/}"           # database name

  # Use port 5432 if not specified
  if echo "$HOST_AND_PORT" | grep -q ':'; then
    DB_HOST="${HOST_AND_PORT%:*}"
    DB_PORT="${HOST_AND_PORT#*:}"
  else
    DB_HOST="$HOST_AND_PORT"
    DB_PORT="5432"
  fi

  JDBC_URL="jdbc:postgresql://$DB_HOST:$DB_PORT/$DB_NAME"
  echo "INFO: DB Host=$DB_HOST Port=$DB_PORT DB=$DB_NAME User=$DB_USER"
  echo "INFO: JDBC URL = $JDBC_URL"

  exec java \
    -Dspring.datasource.url="$JDBC_URL" \
    -Dspring.datasource.username="$DB_USER" \
    -Dspring.datasource.password="$DB_PASS" \
    -jar /app/app.jar
else
  echo "INFO: No DATABASE_URL found, using application.properties defaults"
  exec java -jar /app/app.jar
fi
