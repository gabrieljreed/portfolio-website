---
title: "Octordle Solver - Part 1"
date: 2025-04-27T21:05:30-07:00
draft: false
tags: ["python", "wordle", "octordle"]
weight: 50
cover:
    image: "/projects/octordle-solver/wordle-solver-ui.png"
---

In one of our internal work channels, people post their scores for [Wordle](https://www.nytimes.com/games/wordle/index.html), [Time Guessr](https://timeguessr.com/), [Framed](https://framed.wtf/), and other guessing games. One game that caught my eye was [Octordle](https://www.britannica.com/games/octordle/), solving eight Wordle puzzles at the same time. If I remember right, a couple people were able to just barely beat it, but it was a challenge. I almost beat it myself using the ["STARE, CLOUD, PINKY"](https://www.reddit.com/r/wordle/comments/1537c63/im_sick_of_stare_cloud_pinky/) combo. I love puzzle games and wordplay, and I love programming, so this seemed like a fun side project. I took a lot of inspiration from the [Wordle Bot](https://www.nytimes.com/interactive/2022/upshot/wordle-bot.html) and designed my own Wordle/Octordle solver to work very similarly. You can find all the code on my [GitHub](https://github.com/gabrieljreed/octordle_solver).

The first step was making a Wordle solver. The basic algorithm is to get all the possible remaining words, then figure out what guess will divide that list into the most, smallest groups.

### Remaining Words

I downloaded a list of words in the Scrabble dictionary, then filtered out words that weren't 5 letters long, plural forms of 4 letter words, and words that are technically valid Scrabble words, but aren't spelled correctly by reasonable standards (have you ever heard of "TUBAE", "CORNU", or "MNEME"?)

The solver keeps track of correct letters (green), misplaced letters (yellow), and incorrect letters (gray).

Correct letters are stored in a list where the position reflects where they actually land. Misplaced letters are tuples, the letter itself, and the position it does NOT belong in. Incorrect letters are just stored in a list. For example if we had guessed "CRANE", and gotten a result of ⬜🟨🟩⬜⬜, our lists would look like this:

```python
correct_letters = ["", "", "A", "", ""]    # "A" is found in position 2
misplaced_letters = [("R", 1)]             # "R" is in the word, but not at position 1
incorrect_letters = ["C", "N", "E"]        # "C", "N", and "E" are not in the word
```

And a simple `filter_words` functions looks like this

```python
def filter_words(
    words: list[str],
    correct_letters: list[str],
    misplaced_letters: list[tuple[str, int]],
    incorrect_letters: list[str],
) -> list:
    filtered_words = []
    for word in words:
        # Check if the word contains the correct letters in the correct positions
        if any(word[i] != letter for i, letter in enumerate(correct_letters) if letter):
            continue

        # Check if the word contains the misplaced letters
        if any(letter[0] not in word for letter in misplaced_letters):
            continue

        if any(word[position] == letter for letter, position in misplaced_letters):
            continue

        # Check if the word contains any of the incorrect letters
        if any(letter in word for letter in incorrect_letters):
            continue

        filtered_words.append(word)

    return filtered_words
```

Each time we make a guess, we pass the remaining words and the results of our guess to this function. We keep whittling down the list of remaining words until we get the right answer.

### Generating Groups

The next (and more interesting) step was generating "groups". This means given the current game state, if we were to use a word as our next guess, what words would it eliminate based on the feedback we get from the puzzle.

For example, if the remaining words in our puzzle were GROWN, BROWN, and FROWN, and we wanted to generate groups for the word "BEIGE", our groups would be

```
🟩⬜⬜⬜⬜
BROWN

⬜⬜⬜🟨⬜
GROWN

⬜⬜⬜⬜⬜
FROWN

# 3 groups, largest group = 1
```

However, if we instead used the word "ROUGH", our groups would be

```
🟨🟨⬜⬜⬜
BROWN
FROWN

🟨🟨⬜🟨⬜
GROWN

# 2 groups, largest group = 2
```

Wordle Bot tells us that "on average, more and smaller groups mean faster solving", so we want to pick the word that will give us the most groups, and break ties with the size of the largest group. In this case, "BEIGE" is a better word than "ROUGH" because it breaks the list of remaining words into more, smaller groups.

My `generate_groups` function looks like this

```python
def get_wordle_feedback(guess: str, answer: str) -> list[int]:
    feedback = [PossibilityState.INCORRECT.value] * 5
    answer_chars: list[Union[None, str]] = list(answer)

    for i in range(5):
        if guess[i] == answer[i]:
            feedback[i] = PossibilityState.CORRECT.value
            answer_chars[i] = ""  # Mark as used

    for i in range(5):
        if feedback[i] == PossibilityState.INCORRECT.value and guess[i] in answer_chars:
            feedback[i] = PossibilityState.MISPLACED.value
            answer_chars[answer_chars.index(guess[i])] = ""  # Mark as used

    return feedback

def generate_groups(given_word: str, remaining_words: list[str]):
    groups = defaultdict(list)

    for word in remaining_words:
        feedback = tuple(get_wordle_feedback(given_word, word))
        groups[feedback].append(word)

    return [Group(words, possibility) for possibility, words in groups.items()]
```

A key improvement I made here was in how many groups I tested. I had originally used `itertools.product` to give me every possible answer possibility (`[0, 0, 0, 0, 0]`, `[0, 0, 0, 0, 1]`, `[0, 0, 0, 0, 2]`, `[0, 0, 0, 1, 0]`, etc.) and test each one. However, many of those situations wouldn't actually be possible with the given words. For example, if the guess was "CRANE" and the answer was "BRAVE", the `[0, 0, 0, 0, 0]` (all green) possibility couldn't be valid or the game would be over. The `[1, 1, 1, 1, 1]` (all yellow) possibility couldn't be valid either because the letters of "CRANE" can't be rearranged to make "BRAVE". Instead of brute forcing all possible feedback patterns (243 per word), I only compute the ones that can actually occur.

Before paring down the possibilities to check, running the initial step, where there were still 200-400 words left took 1-2 minutes, even when spreading the work out over several threads using `ProcessPoolExecutor`. Computing only "real" possibilities brought this time down to 1-2 seconds!

## Word list

With my solver, I played through the Wordle archives and compared my results to the "optimal" guesses provided by Wordle Bot. I realized that once I got the algorithm down, all the improvements came from paring down the list of words to valid ones. I originally did a few passes to eliminate plurals of 4 letter words, misspelled words, and proper nouns. This did a decent job, but it wasn't until I sat down (over the course of several evenings) and manually filtered out words that just wouldn't be Wordle answers, (like HAWSE, KAROO, and TASSE), since Wordle avoids obscure and archaic words, even if they're valid answers. Doing this made much more of a difference than I expected - I can now frequently get the most optimal guesses according to Wordle Bot, which it acknowledges with a fun message.

![we-are-as-one](/projects/octordle-solver/we-are-as-one.png)

## UI

I had originally written this as a CLI program, but ended up writing a simple Pyside UI. This made it easier to enter in guesses and results, and let me see group info as I play, useful for debugging, and just fun to see.

![wordle-solver-ui](/projects/octordle-solver/wordle-solver-ui.png)

## Next steps

The next step is to expand the solver out so it can solve 8 puzzles at once so I can finally beat Octordle and impress my coworkers. I'd love to make a web version as well, asking my mom to create a virtual environment to check out my project is a bit of a hard sell. It could also be fun to get it into a lower level language like C++ to see just how fast it can go.

Check the code out on my [GitHub](https://github.com/gabrieljreed/octordle_solver) and let me know what you think!
