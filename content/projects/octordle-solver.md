---
title: "Octordle Solver"
date: 2025-08-22T08:16:07-07:00
draft: false
tags: ["python", "wordle", "octordle"]
cover:
    image: "/projects/octordle-solver/octordle-solver-ui.png"
---

Wordle is fun, but [Octordle](https://www.britannica.com/games/octordle/daily) is a different ball game.  Some of my coworkers post their results in Slack, and I tried to keep up, but my brain can't handle that much parallel processing. I'd already built a [Wordle solver](https://www.gabrieljreed.com/projects/wordle-solver/), so the next logical step was to build an Octordle solver.

On the surface, this seemed pretty straightforward, I already had a working Wordle solver, so it should be pretty straightforward to extend it to several puzzles at the same time. I was able to use a lot of the same logic from the Wordle solver (filtering guesses, generating groups, etc.) but balancing guesses across multiple puzzles required a different approach.

## Choosing the best guess across multiple puzzles

The first thing to do it try for the easy wins - if a puzzle is solved or almost solved, prioritize that, then remove it from the pool.

```python
def get_best_guess_multiple_puzzles(puzzles: list[Puzzle]) -> str:
    # If only 1 puzzle remains, return its best guess
    if len(puzzles) == 1:
        return puzzles[0].all_answers[0].word

    # If a puzzle can be solved in 1 turn, return that word
    for puzzle in puzzles:
        if len(puzzle.remaining_words) == 1:
            return puzzle.all_answers[0].word

    # If a puzzle can be solved in 2 turns, return that word.
    # An answer having a max group size of 1 means that guessing that
    # word will separate the remaining answers into unique groups
    for puzzle in puzzles:
        for answer in puzzle.all_answers:
            if answer.max_group_size == 1:
                return answer.word
```

Why does `max_group_size == 1` guarantee a 2 turn solution? Suppose a puzzle’s remaining possibilities are

```
 CANDY  
 CANOE  
 CANAL  
```

If we guess **CANDY**, the feedback will be unique for each possible answer:

- vs. `CANDY` → 🟩🟩🟩🟩🟩 (solved immediately)
- vs. `CANOE` → 🟩🟩🟩⬜🟨
- vs. `CANAL` → 🟩🟩🟩⬜⬜

No two candidates share the same feedback pattern. That means after guessing **CANDY**, we can tell exactly which word is correct and solve the puzzle on the next turn.

## Otherwise, balance across puzzles

When none of the puzzles have a trivial solution, we have to get a guess that is balanced across the rest of the boards.

- Gather all possible guesses
- Assign weights to each puzzle - puzzles with more uncertainty get more sway
- For each candidate word, get a weighted sum of its score across all puzzles
- Pick the word with the highest score

```python
    scored_guesses = []
    sets = [set(puzzle.all_answers_dict.keys()) for puzzle in puzzles]
    all_words = set.union(*sets)
    total_remaining_words = sum([len(puzzle.remaining_words) for puzzle in puzzles])
    weights = {
        puzzle: (total_remaining_words - len(puzzle.remaining_words)) / total_remaining_words for puzzle in puzzles
    }
    for word in all_words:
        total_score = 0.0
        for puzzle in puzzles:
            answer_possibility = puzzle.all_answers_dict.get(word)
            if not answer_possibility:
                continue
            fitness_score = calculate_fitness_score(answer_possibility, puzzle.remaining_words)
            weight = weights[puzzle]
            total_score += fitness_score * weight

        scored_guesses.append((total_score, word))
    best_guess = max(scored_guesses)[1]
    return best_guess
```

Weighting scores helps ensure we don't waste guesses solving an already-narrow puzzle while ignoring harder ones.

## Scoring a guess

Since we're working with multiple multiple puzzles, we can't just sort by number of groups anymore, so I went with a scoring/fitness function. Each guess gets a fitness score, which uses some of the same intuition of scoring words for a single puzzle:

- More groups are better - a guess that splits the list of remaining words many ways gives us more information
- Smaller groups are better - we don't want to be left with a few big groups
- The word being a possible solution is better - there's a possibility that this is the actual answer, so guessing it might solve a puzzle outright

```python
PENALTY_WEIGHT = 0.1
REMAINING_WORD_BONUS = 2

def calculate_fitness_score(answer_possibility: AnswerPossibility, remaining_words: list[str]) -> float:
    fitness = len(answer_possibility.groups) - (answer_possibility.max_group_size * PENALTY_WEIGHT)

    in_remaining_words = 1 if answer_possibility.word in remaining_words else 0
    remaining_words_bonus = REMAINING_WORD_BONUS * in_remaining_words

    fitness += remaining_words_bonus

    return fitness

```

## UI

Like the Wordle solver, I made a simple PySide UI to help me input all my guesses. I actually ended up making this really early on, because inputting the guesses on the command line was extremely time consuming and error prone. This was a bit of a different approach, since I normally build out the backend of a tool before the frontend, but I really liked being able to visualize what was going on earlier in the development process, and might be something I try for future projects.

![octordle-solver-ui](/projects/octordle-solver/octordle-solver-ui.png)

I also added some settings so it can handle any number of Wordle boards with any number of guesses. I tried it against [Duotrigordle](https://duotrigordle.com/game/daily/normal) and it held up, the only limiting factor was my patience in entering in the results from every single guess.


## Final result

Before I started on my solver, I tried it by myself. I wasn't able to beat it, but I got pretty close. I solved my first puzzle in 5 turns, but ultimately ran out of guesses before I finished the last puzzle.

Daily Octordle #863
🔟7️⃣
🕛5️⃣
8️⃣9️⃣
🕚🟥
Score: 76

The solver was able to make much smarter guesses than me, and finished all 8 puzzles much faster, solving the first puzzle in 2 turns, and finishing all puzzles in 10 turns.

Daily Octordle #1277
5️⃣2️⃣
6️⃣3️⃣
7️⃣🔟
8️⃣9️⃣
Score: 50

Now I can confidently post my results in Slack and let my coworkers think I'm a genius at Octordle, even though it's really just some Python code doing all the work.

## Next steps

Some things I'd like to improve

- Speed optimizations: While this runs fairly quickly on my gaming PC, Octordle still has a lot of state to evaluate, and there's definitely room for better caching and pruning.
- Heuristic tuning: The weights, scores, and penalties are all just values I picked by hand, which I could improve with simulations or some kind of reinforcement learning

If you're interested, the full source code is available [here](https://github.com/gabrieljreed/octordle_solver). And if you have any ideas for improvement, I'd love to hear them!
