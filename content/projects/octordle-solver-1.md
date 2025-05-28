---
title: "Octordle Solver - Part 1"
date: 2025-05-27T21:05:30-07:00
draft: false
tags: ["python", "wordle", "octordle"]
---

In one of our internal work channels, people post their scores for [Wordle](https://www.nytimes.com/games/wordle/index.html), [Time Guessr](https://timeguessr.com/), [Framed](https://framed.wtf/), and other guessing games. One game that caught my eye was [Octordle](https://www.britannica.com/games/octordle/), solving eight Wordle puzzles at the same time. If I remember right, a couple people were able to just barely beat it, but it was a challenge. I almost beat it myself using the ["STARE, CLOUD, PINKY"](https://www.reddit.com/r/wordle/comments/1537c63/im_sick_of_stare_cloud_pinky/) combo. I love puzzle games and wordplay, and I love programming, so this seemed like a fun side project.

I took a lot of inspiration from the [Wordle Bot](https://www.nytimes.com/interactive/2022/upshot/wordle-bot.html)

The first step was making a Wordle solver. The basic algorithm is to get all the possible remaining words, then figure out what guess will divide that list into the most, smallest groups.

### Remaining Words

I downloaded a list of words in the Scrabble dictionary, then filtered out words that weren't 5 letters long, plural forms of 4 letter words, and words that are technically valid Scrabble words, but aren't spelled correctly by reasonable standards (have you ever heard of "AALII"?)

The solver keeps track of correct letters (green), misplaced letters (yellow), and incorrect letters (gray). A simple `filter_words` function looks like this.

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

The next, and more interesting, step was generating "groups". This means given the current game state, if we were to use a word as our next guess, what words would it eliminate based on the feedback we get from the puzzle.

For example, if the remaining words in our puzzle were GROWN, BROWN, and FROWN, and we wanted to generate groups for the word "BEIGE", our groups would be

![generate-groups-1](/projects/octordle-solver/generate-groups-1.png)

However, if we instead used the word "ROUGH", our groups would be

![generate-groups-2](/projects/octordle-solver/generate-groups-2.png)

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

With my solver, I played through the Wordle archives and compared my results to the "optimal" guesses provided by Wordle Bot. I realized that once I got the algorithm down, all the improvements came from paring down the list of words to valid ones. I originally did a few passes to eliminate plurals of 4 letter words

![we-are-as-one](/projects/octordle-solver/we-are-as-one.png)
