#!/usr/bin/env bash
set -euo pipefail

artifact_root="${1:-}"
if [[ -z "$artifact_root" || ! -d "$artifact_root" ]]; then
  echo "Usage: $0 <unpacked-artifact-root>" >&2
  exit 2
fi

if [[ -d "$artifact_root/.aliyun-output/static" ]]; then
  static_root="$artifact_root/.aliyun-output/static"
elif [[ -d "$artifact_root/static" && -f "$artifact_root/static/index.html" ]]; then
  static_root="$artifact_root/static"
elif [[ -f "$artifact_root/index.html" ]]; then
  static_root="$artifact_root"
else
  echo "Cannot find static build output under $artifact_root" >&2
  exit 1
fi

if [[ ! -f "$static_root/index.html" || ! -f "$static_root/game.html" || ! -f "$static_root/version.json" ]]; then
  echo "Static output is missing required HTML or version files: $static_root" >&2
  exit 1
fi

commit_id="${CI_COMMIT_SHA:-${COMMIT_ID:-${GIT_COMMIT:-unknown}}}"
commit_id="${commit_id:0:12}"
commit_id="$(printf '%s' "$commit_id" | tr -cd '[:alnum:]_-')"
if [[ -z "$commit_id" ]]; then
  commit_id="unknown"
fi

timestamp="$(date +%Y%m%d%H%M%S)"
deploy_root="${GAME_DEPLOY_ROOT:-/var/www/25thgame}"
nginx_root="${GAME_NGINX_ROOT:-/etc/nginx}"
release_root="$deploy_root/releases"
current_link="$deploy_root/current"
release_dir="$release_root/${timestamp}-${commit_id}"
staging_dir="$release_root/.${timestamp}-${commit_id}.tmp"
nginx_config_src="$artifact_root/deploy/aliyun-nginx-25thgame.conf"
legacy_http_config_src="$artifact_root/deploy/aliyun-nginx-legacy-http-redirect.conf"
previous_release="$(readlink "$current_link" || true)"
config_target="$nginx_root/conf.d/000-25thgame.conf"
legacy_target="$nginx_root/sites-enabled/beian"
config_backup=""
legacy_backup=""
config_installed=0
release_switched=0
deployment_verified=0
probe_file="$release_root/.${timestamp}-${commit_id}.health.json"

restore_nginx_config() {
  if [[ -n "$config_backup" ]]; then
    cp -p "$config_backup" "$config_target"
  else
    rm -f "$config_target"
  fi
  if [[ -f "$legacy_http_config_src" ]]; then
    if [[ -n "$legacy_backup" ]]; then
      cp -p "$legacy_backup" "$legacy_target"
    else
      rm -f "$legacy_target"
    fi
  fi
}

install_nginx_config() {
  if [[ ! -f "$nginx_config_src" ]]; then
    echo "Nginx config template not found, skipping: $nginx_config_src" >&2
    return 0
  fi

  local disabled_backup_dir="$nginx_root/backup-disabled"
  mkdir -p "$nginx_root/conf.d" "$nginx_root/sites-enabled" "$disabled_backup_dir"
  if [[ -f "$config_target" ]]; then
    config_backup="$disabled_backup_dir/25thgame.${timestamp}.$$.bak"
    cp -p "$config_target" "$config_backup"
  fi
  if [[ -f "$legacy_http_config_src" && -f "$legacy_target" ]]; then
    legacy_backup="$disabled_backup_dir/beian.${timestamp}.$$.bak"
    cp -p "$legacy_target" "$legacy_backup"
  fi
  config_installed=1
  cp "$nginx_config_src" "$config_target"
  if [[ -f "$legacy_http_config_src" ]]; then
    cp "$legacy_http_config_src" "$legacy_target"
  fi
  nginx -t
}

cleanup() {
  local status=$?
  trap - EXIT
  set +e
  if [[ "$status" -ne 0 && "$deployment_verified" -eq 0 ]]; then
    echo "Deployment failed; restoring previous release and configuration" >&2
    if [[ "$release_switched" -eq 1 ]]; then
      if [[ -n "$previous_release" ]]; then
        ln -sfn "$previous_release" "$current_link"
      else
        rm -f "$current_link"
      fi
    fi
    if [[ "$config_installed" -eq 1 ]]; then
      restore_nginx_config
      if [[ -n "$previous_release" ]]; then
        nginx -t && systemctl reload nginx || echo "ERROR: rollback reload failed; manual recovery required" >&2
      fi
    fi
  fi
  rm -rf "$staging_dir"
  rm -f "$probe_file"
  exit "$status"
}
trap cleanup EXIT

mkdir -p "$release_root"
rm -rf "$staging_dir"
mkdir -p "$staging_dir"

rsync -a --delete "$static_root"/ "$staging_dir"/
find "$staging_dir" -type d -exec chmod 755 {} +
find "$staging_dir" -type f -exec chmod 644 {} +

mv "$staging_dir" "$release_dir"
install_nginx_config
ln -sfn "$release_dir" "$current_link"
release_switched=1
systemctl reload nginx

curl --fail --silent --show-error --retry 2 --max-time 15 \
  --noproxy arch.25thgame.vip \
  --resolve arch.25thgame.vip:443:127.0.0.1 \
  https://arch.25thgame.vip/version.json -o "$probe_file"
cmp "$static_root/version.json" "$probe_file"
curl --fail --silent --show-error --retry 2 --max-time 15 \
  --noproxy arch.25thgame.vip \
  --resolve arch.25thgame.vip:443:127.0.0.1 \
  https://arch.25thgame.vip/game.html -o /dev/null
deployment_verified=1

if ! find "$release_root" -maxdepth 1 -mindepth 1 -type d ! -name '.*.tmp' -printf '%T@ %p\n' \
  | sort -rn \
  | awk 'NR > 5 {print $2}' \
  | xargs -r rm -rf; then
  echo "Warning: release cleanup failed; the verified deployment remains active" >&2
fi

echo "Deployed $release_dir"
readlink "$current_link"
