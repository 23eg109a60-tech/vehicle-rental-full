#!/bin/sh
# Render provides DATABASE_URL as either:
#   postgres://user:pass@host:port/db
#   postgresql://user:pass@host:port/db
# Spring Boot needs: jdbc:postgresql://user:pass@host:port/db

if [ -n "$DATABASE_URL" ]; then
  # Strip any postgres:// or postgresql:// prefix, then prepend jdbc:postgresql://
  STRIPPED="${DATABASE_URL#postgres://}"
  STRIPPED="${STRIPPED#postgresql://}"
  JDBC_URL="jdbc:postgresql://$STRIPPED"
  echo "INFO: Converted DATABASE_URL to JDBC: $JDBC_URL"
  exec java \
    -Dspring.datasource.url="$JDBC_URL" \
    -jar /app/app.jar
else
  echo "INFO: No DATABASE_URL found, using application.properties defaults"
  exec java -jar /app/app.jar
fi
