import { autocompletion } from "@codemirror/autocomplete";

function findQuotedRanges(docStr) {
  const ranges = [];
  let i = 0;
  while (i < docStr.length) {
    const start = docStr.indexOf('"', i);
    if (start === -1) break;
    const end = docStr.indexOf('"', start + 1);
    if (end === -1) {
      ranges.push({ from: start + 1, to: Infinity });
      break;
    }
    ranges.push({ from: start + 1, to: end });
    i = end + 1;
  }
  return ranges;
}

function isInsideQuotes(docStr, pos) {
  const ranges = findQuotedRanges(docStr);
  return ranges.some((r) => pos >= r.from && pos < r.to);
}

export function tagAutocompleteExtension(minChars = 1, debounceMs = 100, tagsOrFetcher) {
  if (tagsOrFetcher == null) {
    return autocompletion({ activateOnTyping: false });
  }

  let tagsCache = Array.isArray(tagsOrFetcher) ? tagsOrFetcher : null;
  let fetchPromise = null;

  async function fetchTags() {
    if (tagsCache) return tagsCache;
    if (fetchPromise) return fetchPromise;

    fetchPromise = (async () => {
      tagsCache = await tagsOrFetcher();
      fetchPromise = null;
      return tagsCache;
    })();

    return fetchPromise;
  }

  function buildOptions(query, from) {
    const lowerQuery = query.toLowerCase();
    const filtered = tagsCache.filter((tag) =>
      tag.toLowerCase().startsWith(lowerQuery),
    );
    if (filtered.length === 0) return null;

    return {
      from,
      options: filtered.map((tag) => ({
        label: `#${tag}`,
        displayLabel: tag,
        apply(view, _completion, from, to) {
          view.dispatch({
            changes: { from, to, insert: `#${tag} ` },
            selection: { anchor: from + tag.length + 2 },
          });
        },
      })),
    };
  }

  function tagCompletionSource(context) {
    const word = context.matchBefore(/#[^\s#(),\[\]{}<>]*/);
    if (!word) return null;

    if (isInsideQuotes(context.state.doc.toString(), context.pos)) return null;

    const query = word.text.slice(1);
    if (query.length < minChars) return null;

    if (debounceMs === 0) {
      if (!tagsCache) return fetchTags().then(() => buildOptions(query, word.from));
      return buildOptions(query, word.from);
    }

    return new Promise((resolve) => {
      const timerId = setTimeout(async () => {
        if (context.aborted) {
          resolve(null);
          return;
        }
        if (!tagsCache) await fetchTags();
        resolve(buildOptions(query, word.from));
      }, debounceMs);

      context.addEventListener("abort", () => {
        clearTimeout(timerId);
        resolve(null);
      });
    });
  }

  return autocompletion({
    override: [tagCompletionSource],
    activateOnTyping: true,
  });
}
