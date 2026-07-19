<script>
  import SearchInput from "$lib/search-field/SearchInput.svelte";

  let threshold = $state(0);
  let autocompleteMinChars = $state(0);
  let autocompleteDebounceMs = $state(200);
  let showImplicitOperators = $state(false);
  let implicitOperator = $state("and");

  const tags = [
    'linux', 'git', 'curl', 'nginx', 'postgresql', 'sqlite', 'redis',
    'memcached', 'openssh', 'openssl', 'ffmpeg', 'vim', 'neovim',
    'emacs', 'tmux', 'zsh', 'bash', 'coreutils', 'systemd', 'docker',
    'podman', 'kubernetes', 'containerd', 'runc', 'traefik',
    'haproxy', 'envoy', 'caddy', 'vault', 'consul',
    'etcd', 'prometheus', 'grafana', 'thanos', 'loki', 'jaeger',
    'rust', 'clang', 'llvm', 'gcc', 'make', 'cmake', 'ninja',
    'libressl', 'polars', 'duckdb', 'clickhouse',
    'zstd', 'lz4', 'rsync', 'wireshark',
    'varnish', 'squid', 'openvpn', 'wireguard',
    'libvirt', 'qemu', 'wayland',
    'mesa', 'pipewire', 'bluez',
    'nftables', 'iptables',
    'busybox', 'alpine', 'nixos',
    'debian', 'arch', 'gentoo',
  ];
</script>

<h1>svelte-codemirror-search-conceal-poc</h1>

<p class="subtitle">
  Enriched search field using CodeMirror and the conceal mechanism. Tags and boolean
  operators are displayed as pills when the cursor is away. Supports autocompletion
  on <kbd>#</kbd>, parenthesis balance validation, and configurable conceal threshold.
</p>

<details open>
  <summary>Configuration</summary>

  <div class="config-row">
    <label for="threshold">Conceal threshold (default 0):</label>
    <input type="number" id="threshold" bind:value={threshold} min="0" max="20" />
    <span class="config-value">={threshold}</span>
  </div>

  <div class="config-row">
    <label for="autocomplete-min-chars">Autocomplete min chars (default 0):</label>
    <input type="number" id="autocomplete-min-chars" bind:value={autocompleteMinChars} min="0" max="10" />
    <span class="config-value">={autocompleteMinChars}</span>
  </div>

  <div class="config-row">
    <label for="autocomplete-debounce">Autocomplete debounce (default 200ms):</label>
    <input type="number" id="autocomplete-debounce" bind:value={autocompleteDebounceMs} min="0" max="2000" step="50" />
    <span class="config-value">={autocompleteDebounceMs}ms</span>
  </div>

  <div class="config-row">
    <label>
      <input type="checkbox" bind:checked={showImplicitOperators} />
      Show implicit operators between consecutive tags (default off)
    </label>
  </div>

  {#if showImplicitOperators}
    <div class="config-row">
      <span>Default implicit operator (default and):</span>
      <label><input type="radio" bind:group={implicitOperator} value="and" /> and</label>
      <label><input type="radio" bind:group={implicitOperator} value="or" /> or</label>
    </div>
  {/if}
</details>

<hr />

<p class="demo-label">Search input demo 1 — tags with explicit operators</p>
<div class="demo-input">
  <SearchInput
    threshold={threshold}
    autocompleteMinChars={autocompleteMinChars}
    autocompleteDebounceMs={autocompleteDebounceMs}
    showImplicit={showImplicitOperators}
    implicitOp={implicitOperator}
    doc="#linux and #git or #postgresql"
    ph="Search..."
    tags={tags}
  />
</div>

<hr class="input-sep" />

<p class="demo-label">Search input demo 2 — tags with parentheses</p>
<div class="demo-input">
  <SearchInput
    threshold={threshold}
    autocompleteMinChars={autocompleteMinChars}
    autocompleteDebounceMs={autocompleteDebounceMs}
    showImplicit={showImplicitOperators}
    implicitOp={implicitOperator}
    doc="(#docker #podman) and (#linux #git)"
    ph="Search..."
    tags={tags}
  />
</div>

<hr class="input-sep" />

<p class="demo-label">Search input demo 3 — tags only (no operators)</p>
<div class="demo-input">
  <SearchInput
    threshold={threshold}
    autocompleteMinChars={autocompleteMinChars}
    autocompleteDebounceMs={autocompleteDebounceMs}
    showImplicit={showImplicitOperators}
    implicitOp={implicitOperator}
    doc="#ffmpeg #wireshark #ffmpeg"
    ph="Search..."
    tags={tags}
  />
</div>

<style>
  hr {
    border: none;
    border-top: 1px solid #ddd;
    margin: 24px 0;
  }

  hr.input-sep {
    margin: 24px 0;
  }

  details {
    margin-bottom: 0;
  }

  summary {
    cursor: pointer;
    font-size: 13px;
    color: #666;
    margin-bottom: 8px;
  }

  .subtitle {
    font-size: 14px;
    color: #555;
    line-height: 1.5;
    margin: -12px 0 20px;
  }

  .subtitle kbd {
    font-family: ui-monospace, monospace;
    font-size: 12px;
    padding: 1px 5px;
    border: 1px solid #ccc;
    border-bottom-width: 2px;
    border-radius: 3px;
    background: #f5f5f5;
  }

  .config-row {
    margin-top: 8px;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .config-row input[type="number"] {
    width: 60px;
  }

  .config-value {
    font-family: monospace;
    color: #666;
  }

  .demo-label {
    font-size: 13px;
    font-weight: 600;
    color: #444;
    margin: 0 0 4px;
  }

  .demo-input {
    margin-bottom: 4px;
  }
</style>
