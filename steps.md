12. Testing:
Load the game: Verify it starts in 'pre_battle' phase and only the "Start Battle" and "View Deck" buttons are active (alongside player/enemy displays if rendered in this phase).
Click "Start Battle": Verify the phase changes to 'fighting', the GameUI appears, and the first card is drawn.
Play through a fight: Win the battle.
Rewards: Verify the RewardScreen appears.
Select/Skip Rewards: Verify that after handling all reward sets, the game automatically transitions to the next fight (new enemy, phase back to 'fighting', first card drawn) without needing a "Next Floor" button.
"View Deck": Test clicking the button at various stages (pre-battle, during fight, reward screen) to ensure the deck view modal opens and displays the correct cards. Test closing it.
Test Game Over flow.
13. Documentation (instructions.md & readme.md):
Update instructions.md:
Describe the new 'pre_battle' phase.
Describe the new 'startBattle' action.
Describe the new ActionPanel.tsx and DeckView.tsx components.
Update the description of Game.tsx to include rendering ActionPanel, handling the 'pre_battle' phase, and managing DeckView visibility.
Update PlayerState in types.ts description to include allCards.
Clarify the game flow regarding starting battles and handling rewards/floor progression.
Update readme.md with basic usage instructions reflecting the new "Start Battle" flow.