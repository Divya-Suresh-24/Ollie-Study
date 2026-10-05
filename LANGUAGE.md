# Pelan: the river language

A small artificial language with one agreement rule, in the style of the gender-agreement paradigm (Morgan-Short et al., 2010).

## Vocabulary

| Pelan | English | Class |
|---|---|---|
| mira | fish | -a |
| pela | river | -a |
| suna | moon | -a |
| tavo | stone | -o |
| kelo | shell | -o |
| bino | leaf | -o |
| vel- | big | describing word |
| tip- | small | describing word |
| rus- | red | describing word |
| nil- | blue | describing word |

**Rule:** the describing word comes after the thing-word and copies its ending: *mira vela* (big fish), *tavo velo* (big stone), *suna nila* (blue moon), *kelo ruso* (red shell).

## Lessons (identical for every participant)

| # | Title | Teaches | Items | Exercise types |
|---|---|---|---|---|
| 1 | First words | the 6 nouns | 10 | new word, pick the picture, choose the answer, match (3 pairs) |
| 2 | Word practice | the 6 nouns, reinforced | 10 | pick the picture, choose the answer, type it, match (6 pairs) |
| 3 | Big and small | vel-, tip-, the ending rule | 9 | new word, grammar tip, pick the picture, choose, build, right or wrong |
| 4 | Ending practice | the rule, reinforced | 10 | grammar tip, choose, right or wrong, build, pick the picture, type it, match |
| 5 | Colors | rus-, nil-, same rule | 10 | new word, grammar tip, pick the picture, choose, build, right or wrong, type it, match |
| 6 | River review | everything | 10 | all types |

Lesson 1 is deliberately light (6 new words, 4 easy checks). Wrong answers come back once at the end of a lesson.

## Taught vs. held-back phrases

Only these phrases appear in lessons, feedback, the word list and flashcards:

- **Size (8):** mira vela, mira tipa, pela tipa, suna vela, suna tipa, tavo velo, kelo tipo, bino tipo
- **Color (6):** mira rusa, mira nila, kelo ruso, suna nila, tavo nilo, bino ruso

**Held back for the quiz (never shown):** pela vela, kelo velo, bino velo, tavo tipo, pela rusa, pela nila, bino nilo, suna rusa, tavo ruso, kelo nilo.

Ungrammatical forms shown in "right or wrong?" items (and corrected to taught phrases): kelo tipa, pela tipo, suna nilo, kelo rusa, plus the distractor *mira velo* in Lesson 4.

## Retention quiz (build in Qualtrics)

**A. Vocabulary recognition** (6 items, multiple choice): "What does *kelo* mean?" shell / leaf / stone / moon, and so on for each noun.

**B. Vocabulary recall** (4 items, typed): river (pela), leaf (bino), moon (suna), stone (tavo).

**C. Grammaticality judgment** (12 items, correct / incorrect; mixes taught and held-back)

| Item | Key |
|---|---|
| mira vela | correct (taught) |
| tavo vela | incorrect |
| kelo velo | correct (held back) |
| suna tipo | incorrect |
| pela vela | correct (held back) |
| bino tipa | incorrect |
| tavo tipo | correct (held back) |
| mira velo | incorrect |
| pela rusa | correct (held back) |
| kelo nila | incorrect |
| bino nilo | correct (held back) |
| tavo rusa | incorrect |

**D. Production and transfer** (5 items, typed): small stone (tavo tipo), big shell (kelo velo), big river (pela vela), red river (pela rusa), blue leaf (bino nilo).

Score each section separately and in total. Held-back items in C and D test rule learning rather than memorised pairs. Participants who quit before Lessons 3 or 5 never saw the size or color words, so record `lessons_completed` (in the sessions tab) as a covariate.
