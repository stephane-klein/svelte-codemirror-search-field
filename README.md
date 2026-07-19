# svelte-codemirror-search-field component

A Svelte search field component that uses CodeMirror and the conceal mechanism to highlight tags and boolean operators as pills, with autocompletion on <kbd>#</kbd>.

Demo: https://stephane-klein.github.io/svelte-codemirror-search-conceal-poc/

This component is extracted from the [svelte-codemirror-search-conceal-poc](https://github.com/stephane-klein/svelte-codemirror-search-conceal-poc) proof-of-concept, which implements the idea described in this note (in French): [POC champ de recherche enrichi avec CodeMirror et conceal](https://notes.sklein.xyz/Projet%2038/zen/).

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

## Development

### Prerequisite

Install [mise](https://mise.jdx.dev/getting-started.html) — it will handle installing Node.js and pnpm for you.

### Getting Started

```bash
$ mise install
$ pnpm install
```

### Dev server

```bash
$ pnpm run dev
```

Open http://localhost:5173/ in your browser.

### Publish to npm

```bash
$ mise run publish
```

## Development Time

This project was built in about 2 hours and 30 minutes.

## AI-Assisted Development

This project was developed using:

- [OpenCode](https://opencode.ai) CLI — coding assistant workflow (not vibe coding)
- Models: DeepSeek V4 Flash
