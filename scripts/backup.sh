#!/bin/sh
# Daily encrypted pg_dump to /backups and R2, `backup.sh now` runs once
set -eu -o pipefail

KEEP_LOCAL=7

backup() {
	rm -f /backups/*.part
	file="pawnshop-$(date -u +%Y%m%d-%H%M%S).dump.age"
	pg_dump -Fc | age -r "$AGE_RECIPIENT" > "/backups/$file.part"
	mv "/backups/$file.part" "/backups/$file"
	rclone copyto --s3-no-check-bucket "/backups/$file" "r2:$R2_BUCKET/$file"
	ls -1t /backups/*.dump.age | tail -n +$((KEEP_LOCAL + 1)) | xargs -r rm --
	echo "backup: $file"
}

if [ "${1:-}" = now ]; then
	backup
	exit
fi

while true; do
	# Next 02:00 UTC
	now=$(date -u +%s)
	next=$(date -u -d "$(date -u +%Y-%m-%d) 02:00" +%s)
	[ "$next" -gt "$now" ] || next=$((next + 86400))
	sleep $((next - now))
	# Separate process, set -e doesn't apply inside ||
	"$0" now || echo "backup failed" >&2
done
