# Um, Actually...
This repo hosts the stats for the episodes of College Humor's web series, "Um, Actually...".

I quickly threw this together to get something on the web.
Long-term, I want to have the episodes broken down by question (with topic, actual "Um, actually..." said, earned versus unearned point, etc.).

## Data
The data is stored in `data.json`.

### Layout
There are three top-level objects:

* `seasons`; this is the list of seasons.
* `people`; this is the list of people.
* `titles`; this is the list of shiny questions.
* `topics`; thsi is the list of topics.
* `episodes`; this is the list of episodes.

## Testing
I recommend a simple HTTP server:

```
python -m SimpleHTTPServer 8000
```
