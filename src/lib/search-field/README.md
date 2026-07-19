# svelte-codemirror-search-field

A Svelte search field component that uses CodeMirror and the conceal mechanism to highlight tags and boolean operators as pills, with autocompletion on `#`.

## Installation

```bash
pnpm add svelte-codemirror-search-field
```

## Usage

```svelte
<script>
  import SearchField from 'svelte-codemirror-search-field';
</script>

<SearchField doc="#linux #git" tags={['linux', 'git', 'nginx']} />
```

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `doc` | string | `''` | Initial document content |
| `ph` | string | `'Search...'` | Placeholder text when empty |
| `tags` | `string[] \| (() => Promise<string[]>)` | `null` | Tag list for autocomplete (`null` = disabled) |
| `threshold` | number | `0` | Distance in chars before conceal activates |
| `autocompleteMinChars` | number | `0` | Min chars after `#` before autocomplete triggers |
| `autocompleteDebounceMs` | number | `200` | Debounce delay for autocomplete popup |
| `showImplicit` | boolean | `false` | Show implicit AND/OR between consecutive tags |
| `implicitOp` | `'and' \| 'or'` | `'and'` | Default implicit operator |
| `onchange` | `(value: string) => void` | `() => {}` | Called on every document change |

### Example with async tag source

```svelte
<script>
  import SearchField from 'svelte-codemirror-search-field';

  const fetchTags = async () => {
    const res = await fetch('/api/tags');
    return res.json();
  };
</script>

<SearchField
  doc="#linux or #git"
  tags={fetchTags}
  threshold={2}
  showImplicit
  implicitOp="or"
/>
```

## License

MIT
