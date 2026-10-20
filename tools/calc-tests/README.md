# Calculator regression checks

The four free calculators (`/free-tools/<slug>/`) were integrated from the
originals kept, unchanged, in `static/Tools/*.txt`. These checks make sure the
integrated pages still give exactly the originals' results.

| File | What it is |
|---|---|
| `scenarios.py` | The scenarios: defaults, typical cases, several rows, rows added and removed, optional features on and off, empty / zero / negative values, waste and rounding boundaries (both sides of `up()`'s `1e-9`), prices, comparisons; for paint, every product in its stage. |
| `harness.js` | Runs in the page: applies a scenario's steps and captures every displayed result (numbers and "—"), row titles, remove buttons, option lists, verdict states and the report's KPIs, tables and notes. |
| `baselines/<tool>.json` | What the **originals** displayed for each scenario (recorded before the integration). |
| `pure.js`, `pure.html` | Checks of the calculation modules (`static/js/tools/<slug>-calc.js`) on their own, against figures worked out by hand from the formulas. |
| `run.py` | The runner (headless Chrome; standard library + Django). |

```
python tools/calc-tests/run.py check       # the integrated pages, English and Arabic, against the baselines
python tools/calc-tests/run.py pure        # the calculation modules
python tools/calc-tests/run.py originals   # the originals still give the baselines
python tools/calc-tests/run.py record      # re-record the baselines from the originals (after adding scenarios)
```

`--tool bricks|tiles|wire|paint` limits a run to one tool. The Django test
suite runs `pure` and `check` when `CALC_BROWSER_TESTS=1` is set, and always
checks that the originals are unchanged (md5) and that the modules carry their
data and formulas word for word.

Element ids, `data-row` numbers and option values on the integrated pages are
the originals', so the same steps drive both. Wording is compared only through
its figures, so English, Arabic and the original Egyptian Arabic compare equal
exactly when the figures are equal. `work/` (ignored by git) holds the HTML
copies of the originals, the rendered pages and the browser profile.
