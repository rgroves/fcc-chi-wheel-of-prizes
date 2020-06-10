# Wheel of Prizes

This is a minimal specifications document for a Wheel of Fortune clone game. The game will be more inspired by, than an exact replica of all elements of Wheel of Fortune.

## Players

- [ ] Game will be played with two players
- [ ] Players should be labeled Player 1 and Player 2
- [ ] Two scores will need to be maintained per player: current round score and game total score

## The Wheel

- [ ] There should be 24 spaces in the wheel populated as follows:
  - [ ] There should be two "Bankrupt" spaces
  - [ ] There should be one "Lose a Turn" space
  - [ ] Remaining spaces should have prize values ranging from $500 to $2500

## Gameplay

- [ ] Each game will consist of three rounds.

### Game Start

- [ ] Players should start each game with a game total score set to \$0

### New Round Setup

- [ ] A new category and puzzle pair are randomly chosen
- [ ] Show category
- [ ] Show blank word puzzle
- [ ] Any punctuation in the puzzle should be revealed
- [ ] Players should start each round with a current round score set to \$0
- [ ] Show players and current round scores
- [ ] Choose a random player who will start the first round
  - [ ] For subsequent rounds, the player who went second in the previous round goes first
- [ ] Show some kind of indicator for which player is currently playing the turn

### Round Play

- [ ] Player spins wheel to determine dollar value used for scoring
- [ ] Player guesses a consonant
- [ ] If consonant is present in the puzzle, player's score is incremented by:  
       Dollar value from spin multiplied by the number of times the letter occurs in the puzzle
- [ ] Player chooses between: buy a vowel, spin again, or solve puzzle
- [ ] Vowels can be purchased for \$250
  - [ ] A player may continue to buy vowels if they have enough money to do so
  - [ ] Purchased vowels that occur in the puzzle do not add any value to the player's score
- [ ] Control passes to next player if:
  - [ ] The wheel lands on the Lose a Turn space
  - [ ] The wheel lands on a Bankrupt space
    - [ ] Landing on a Bankrupt space should also reset player's current round score to \$0 before forfeiting their turn
  - [ ] Player guesses a letter that is not in the puzzle
  - [ ] Player guesses a letter that has already been guessed
  - [ ] Player fails to guess within 5 seconds of the wheel stopping
  - [ ] Player unsuccessfully attempts to solve the puzzle
  - [ ] Player fails to solve the puzzle within 15 seconds of choosing to solve
- [ ] If player guesses the last letter successfully or correctly solves the puzzle, the player wins the round

### End of Round

- [ ] Player with the highest current round score adds that value to their game total score
- [ ] Display all players total scores briefly before the next round starts

## Future Enhancements

Below are some suggestions for enhancements you may want to make to your version of the game:

- [ ] Restyle the game giving it your own unique touch of creativity
- [ ] Implement a "Reset" button to restart the game without having to refresh
- [ ] Allow for one (or more) additional player
- [ ] Implement a "Game Setup" screen to set number of players and customize player names
- [ ] Implement AI for computer-controlled players
- [ ] Implement a Canvas version of the wheel
- [ ] Implement special prizes on various wheel spaces (Free Play, Wild, Gifts, etc.)
- [ ] Implement special puzzles (Toss-Up, Crossword, etc.)
- [ ] Implement a bonus round like the bonus round on Wheel of Fortune
