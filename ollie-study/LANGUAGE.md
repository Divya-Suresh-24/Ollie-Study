# Pelan: the river language

A small artificial language in the style of the gender-agreement paradigm (Morgan-Short et al., 2010). It has a small vocabulary and one agreement rule.

## Vocabulary

| Pelan | English | Class |
|---|---|---|
| mira | fish 🐟 | -a |
| pela | river 🌊 | -a |
| suna | moon 🌙 | -a |
| tavo | stone 🪨 | -o |
| kelo | shell 🐚 | -o |
| bino | leaf 🍃 | -o |
| vel- | big | adjective |
| tip- | small | adjective |

## Rule
The adjective comes **after** the noun and **copies its ending** (-a or -o).

| Phrase | Meaning |
|---|---|
| mira vela | big fish |
| tavo velo | big stone |
| suna tipa | small moon |
| bino tipo | small leaf |

All 12 phrases: mira vela/tipa, pela vela/tipa, suna vela/tipa, tavo velo/tipo, kelo velo/tipo, bino velo/tipo.

## Which phrases Lesson 1 teaches (same for everyone)
**Trained in Lesson 1 (8):** mira vela, mira tipa, pela tipa, suna vela, suna tipa, tavo velo, kelo tipo, bino tipo.
Participants also see the ungrammatical *kelo vela*, which is marked wrong.

**Novel after Lesson 1 (4):** pela vela, kelo velo, bino velo, tavo tipo. *tavo tipo* appears only as a picture option, never as text.

Practice rounds use random phrases, and each round's items are logged in the `round_start` event. From that you can tell which novel phrases a participant later practised.

## Suggested retention quiz (build it in your survey tool)

**A. Vocabulary recognition** (6 items, multiple choice)
"What does *kelo* mean?" with the options shell / leaf / stone / moon, and so on for each noun.

**B. Vocabulary recall** (4 items, typed)
"Type the Pelan word for *river*." (pela), "…for *leaf*." (bino), "…for *moon*." (suna), "…for *stone*." (tavo)

**C. Grammaticality judgment** (8 items, correct / incorrect; mix trained and novel)
| Item | Key |
|---|---|
| mira vela | correct |
| tavo vela | incorrect |
| kelo velo | correct (novel) |
| suna tipo | incorrect |
| pela vela | correct (novel) |
| bino tipa | incorrect |
| tavo tipo | correct (novel) |
| mira velo | incorrect |

**D. Production and transfer** (3 items, typed)
"Translate *small stone*." (tavo tipo), "Translate *big shell*." (kelo velo), "Translate *big river*." (pela vela)

Score each section separately and in total. Section C (and novel items in C and D) checks rule learning rather than memorised pairs.
