# The Hound of the Baskervilles (Arthur Conan Doyle, 1902). Public domain.
STAMP = "hound1902"
TITLE = "The Hound of the Baskervilles"
BLURB = "Conan Doyle's Dartmoor mystery, modelled chapter by chapter: every clue is a fact, every deduction a cause. Scenes hold synopses; fetch the text with Import → Gutenberg 2852."
NOTE = "This scene holds a synopsis in place of the chapter. To bring in Doyle's text, use Import manuscript with Project Gutenberg book 2852."

ELEMENTS = [
    ("Sherlock Holmes", "🕵️", "The consulting detective of 221B Baker Street; reasons from small things and keeps his own counsel."),
    ("Dr. John Watson", "🩺", "Holmes's friend and chronicler; sent to Dartmoor as Sir Henry's guardian and reporter."),
    ("Sir Henry Baskerville", "🎩", "Heir to Baskerville Hall, raised in Canada; brave, hot-tempered, newly rich."),
    ("Sir Charles Baskerville", "⚰️", "The late baronet, generous and nervous of the family legend; found dead in the Yew Alley."),
    ("Dr. James Mortimer", "🦴", "Country doctor and amateur anthropologist; Sir Charles's friend and the man who brings the case to Holmes."),
    ("Jack Stapleton", "🦋", "A naturalist of Merripit House with a butterfly net; in truth a Baskerville with designs on the estate."),
    ("Beryl Stapleton", "👩‍🦱", "Passes as Stapleton's sister; is his wife, Costa Rican, beautiful and afraid of him."),
    ("Barrymore", "🕯️", "Butler at Baskerville Hall, bearded; carries a candle to the window at night."),
    ("Mrs. Barrymore", "😢", "The butler's wife, heard sobbing in the night; Selden's sister."),
    ("Selden", "🔪", "The Notting Hill murderer, escaped from Princetown and hiding on the moor."),
    ("Laura Lyons", "✉️", "Frankland's estranged daughter, a typist in Coombe Tracey; wrote to Sir Charles."),
    ("Mr. Frankland", "🔭", "Litigious old man of Lafter Hall who watches the moor through a telescope."),
    ("Hugo Baskerville", "👹", "The wicked ancestor of 1742 whose death began the legend."),
    ("The Hound", "🐕", "An enormous dog, half mastiff half bloodhound, painted with phosphorus to glow in the dark."),
    ("Baskerville Hall", "🏰", "The ancestral house on Dartmoor, with its Yew Alley and moor gate."),
    ("Merripit House", "🏡", "The Stapletons' lonely house on the moor."),
    ("The Grimpen Mire", "🌫️", "A great bog that swallows ponies and men; Stapleton alone knows a path through it."),
    ("Dartmoor", "🌄", "The wild moor of tors, bogs and prehistoric stone huts."),
    ("The Yew Alley", "🌲", "The gloomy walk at Baskerville Hall where Sir Charles died."),
    ("The Moor Gate", "🚧", "The wicket gate from the Yew Alley onto the moor, where Sir Charles waited."),
    ("Coombe Tracey", "🏘️", "The nearest town, where Laura Lyons lives."),
    ("221B Baker Street", "🚪", "Holmes's rooms in London."),
    ("The Northumberland Hotel", "🏨", "Sir Henry's London hotel, where his boots go missing."),
    ("Cartwright", "👦", "The district messenger boy Holmes employs in London and on the moor."),
    ("John Clayton", "🚕", "Cabman No. 2704, who drove the bearded spy."),
    ("Inspector Lestrade", "👮", "The Scotland Yard man Holmes summons for the finish."),
    ("Rodger Baskerville", "🌎", "Sir Charles's younger brother, the black sheep who fled to South America."),
    ("Mortimer's Walking Stick", "🦯", "The Penang lawyer left at Baker Street, from which Holmes and Watson read its owner."),
    ("Sir Henry's Boots", "👞", "A new tan boot and then an old black one, stolen at the hotel."),
    ("The Warning Letter", "📄", "Words cut from the Times: as you value your life or your reason keep away from the moor."),
    ("The 1742 Manuscript", "📜", "The Baskerville family paper telling the legend of the hound."),
    ("The Portrait of Hugo", "🖼️", "A 1647 portrait in the Hall whose face, under the hat and curls, is Stapleton's."),
    ("Phosphorus", "✨", "The luminous paste on the hound's jaws and eyes."),
    ("The Stone Huts", "🪨", "Prehistoric dwellings on the moor where Selden, and then Holmes, shelter."),
    ("Lafter Hall", "🏚️", "Frankland's house, with the telescope on the roof."),
    ("Ross and Mangles", "🏪", "The Fulham Road dealers who sold Stapleton the hound."),
    ("Mortimer's Spaniel", "🐶", "Dr. Mortimer's curly-haired spaniel, which the hound later kills."),
]

def p(*paras): return list(paras)

SCENES = [
    ("Chapter 1 · Mr. Sherlock Holmes", p(
        "A visitor has left his walking stick at Baker Street. Watson reads it as the property of an elderly, respected country doctor; Holmes corrects him point by point: the owner is young, amiable, absent-minded, and the possessor of a dog larger than a terrier and smaller than a mastiff — a curly-haired spaniel.",
        "Dr. James Mortimer arrives to claim the stick, admires the shape of Holmes's skull, and announces that he has a serious and extraordinary problem.")),
    ("Chapter 2 · The Curse of the Baskervilles", p(
        "Mortimer reads a manuscript dated 1742. In the time of the Great Rebellion, Hugo Baskerville carried off a yeoman's daughter; she fled across the moor; Hugo swore himself to the Devil and rode after her. His companions found both dead in a hollow, and over Hugo's throat stood a great black hound that tore it out. The paper warns the family never to cross the moor in the dark hours.",
        "Then Mortimer reads the recent newspaper account of Sir Charles Baskerville's death in the Yew Alley, ascribed to heart failure. He adds what he kept from the inquest: near the body he saw the footprints of a gigantic hound.")),
    ("Chapter 3 · The Problem", p(
        "Mortimer describes the scene. Sir Charles had stood at the moor gate for five or ten minutes — cigar ash showed it — and then walked on, but his footprints changed as though he were running on his toes. The alley was dry; the hound's prints were on the path, not the grass; the gate was closed and padlocked.",
        "The next heir, Sir Henry Baskerville, is arriving from Canada. Holmes asks for a day alone with the problem and three ounces of shag tobacco, and by evening has the ordnance map of the moor by heart.")),
    ("Chapter 4 · Sir Henry Baskerville", p(
        "Sir Henry comes to Baker Street with Mortimer and a puzzle of his own: a letter at the Northumberland Hotel, its words pasted from a newspaper — As you value your life or your reason keep away from the moor. Holmes identifies the type as yesterday's Times leader and notes the address written in a hotel, in a hurry, with a bad pen.",
        "Sir Henry has also lost a new tan boot. Holmes and Watson follow the two men through London and spot a cab trailing them, its passenger a man with a bushy black beard, who escapes when he sees Holmes. Holmes notes the cab's number, 2704.")),
    ("Chapter 5 · Three Broken Threads", p(
        "At the hotel the tan boot is still missing but an old black boot has now gone too, and later the tan one reappears. Sir Henry resolves to go to Devonshire; Holmes cannot leave London and proposes Watson as companion.",
        "Cartwright, a messenger boy, is set to search the hotels for a cut-up Times and finds nothing. The cabman, John Clayton, reports that his bearded fare said he was a detective and gave his name as Sherlock Holmes. Three threads are broken.")),
    ("Chapter 6 · Baskerville Hall", p(
        "Watson, Sir Henry and Mortimer travel down to Devon. At the station and on the road there are soldiers: Selden, the Notting Hill murderer, has escaped from Princetown and is loose on the moor.",
        "Baskerville Hall is dark and ancient. The butler Barrymore and his wife receive them and give notice. In the night Watson hears a woman sobbing somewhere in the house.")),
    ("Chapter 7 · The Stapletons of Merripit House", p(
        "Watson meets Stapleton, a naturalist with a butterfly net, who already knows who Watson is and why he has come. Stapleton shows him the Grimpen Mire — a moor pony is sucked under as they watch — and a long low moan rolls over the moor that the country people call the hound.",
        "Stapleton runs off after a Cyclopides. His sister Beryl, dark and beautiful, mistakes Watson for Sir Henry and urgently begs him to go back to London; when her brother returns she pretends she said nothing of the kind.")),
    ("Chapter 8 · First Report of Dr. Watson", p(
        "Sir Henry is drawn to Beryl Stapleton, and Stapleton plainly dislikes it. Watson introduces Mr. Frankland of Lafter Hall, who spends his money on lawsuits and his evenings at a telescope watching for the convict.",
        "In the small hours Watson sees Barrymore creep along the corridor and stand at a west window with a candle, staring out at the moor, before putting out the light.")),
    ("Chapter 9 · The Light upon the Moor", p(
        "Stapleton bursts out furiously when he finds Sir Henry proposing to Beryl, then calls to apologise and invites them to dine. Watson and Sir Henry catch Barrymore at the window; his candle is a signal answered by a light on the moor. Mrs. Barrymore confesses: the convict Selden is her brother, and they have been feeding him.",
        "The two men go out to take Selden and hear the hound's cry across the moor. Selden escapes among the rocks. On a tor against the moon Watson sees the figure of a tall thin man, standing alone.")),
    ("Chapter 10 · Extract from the Diary of Dr. Watson", p(
        "Barrymore, grateful that Selden is to be let go abroad, offers what he knows: on the day he died Sir Charles received a letter from Coombe Tracey; Mrs. Barrymore saw the burned remains, with the words 'Please, please, as you are a gentleman, burn this letter, and be at the gate by ten o'clock. L. L.'",
        "Mortimer identifies L. L. as Laura Lyons, Frankland's daughter, who married badly and types for her living. Barrymore adds that Selden has seen another man on the moor, a gentleman living in the old stone huts and fed by a boy.")),
    ("Chapter 11 · The Man on the Tor", p(
        "Watson calls on Laura Lyons. She admits she wrote asking Sir Charles to meet her at the gate — she needed money to free herself from her husband — but swears she never went. Frankland, delighted, shows Watson through his telescope a boy carrying a bundle to the stone huts.",
        "Watson finds the hut, waits inside with his revolver, and hears a voice: 'It is a lovely evening, my dear Watson.' The man on the tor is Holmes.")),
    ("Chapter 12 · Death on the Moor", p(
        "Holmes has been on the moor all along, with Cartwright bringing food; Watson's reports came to him a day late. He has learned that the woman passing as Stapleton's sister is his wife, and that Stapleton has promised Laura Lyons marriage. Stapleton is the enemy.",
        "A scream and the baying of the hound. They find a man fallen from the rocks, dead, in Sir Henry's tweed suit — but the face is Selden's: Barrymore had passed Sir Henry's old clothes to him. Stapleton appears out of the dark and is visibly astonished to find the dead man is not Sir Henry.")),
    ("Chapter 13 · Fixing the Nets", p(
        "At the Hall, Holmes studies the portraits and covers the hat and curls of Hugo Baskerville's 1647 picture: the face is Stapleton's. He is a Baskerville, and the inheritance is his motive.",
        "Holmes tells Sir Henry to dine alone at Merripit House and walk home across the moor, while he and Watson pretend to leave for London. They call on Laura Lyons and tell her Stapleton is married; she tells them everything. Lestrade arrives on the evening train.")),
    ("Chapter 14 · The Hound of the Baskervilles", p(
        "Fog rolls over the Grimpen Mire as Holmes, Watson and Lestrade lie in wait. Sir Henry leaves Merripit House and walks into the mist — and out of it comes the hound, enormous, its jaws and eyes blazing with fire. Holmes and Watson empty their revolvers; Holmes puts five barrels into its flank and it dies at Sir Henry's throat. Phosphorus is on its muzzle.",
        "In Merripit House they find Beryl bound to a post and beaten; she points them to the mire. Stapleton has fled into the fog across the Grimpen Mire and is never seen again. On an island in the bog they find his hound's lair and one of Sir Henry's boots.")),
    ("Chapter 15 · A Retrospection", p(
        "Holmes lays it out. Stapleton was the son of Rodger Baskerville, who fled to South America; he kept a school in Yorkshire under the name Vandeleur, then came to Devon as Stapleton with his wife posing as his sister. He bought the dog from Ross and Mangles in the Fulham Road, hid it on an island in the mire, and used Laura Lyons to draw Sir Charles to the gate, where the glowing hound frightened the old man to death.",
        "Beryl would not lure Sir Henry, so she cut the warning from the Times herself. The stolen new boot carried no scent, so Stapleton took an old one. The bearded spy in London was Stapleton. Holmes stayed hidden on the moor so that the enemy would not know he was there.")),
]

# (statement, [elements], [scene indexes], [causes])
FACTS = [
    ("Dr. Mortimer left his walking stick at Baker Street.", ["Dr. James Mortimer", "Mortimer's Walking Stick", "221B Baker Street"], [0], []),
    ("Holmes deduces from the stick that Mortimer is a young, absent-minded country doctor who owns a curly-haired spaniel.", ["Sherlock Holmes", "Dr. James Mortimer", "Mortimer's Walking Stick", "Mortimer's Spaniel"], [0], ["Dr. Mortimer left his walking stick at Baker Street."]),
    ("Mortimer was Sir Charles's friend and medical attendant.", ["Dr. James Mortimer", "Sir Charles Baskerville"], [0, 1], []),
    ("The 1742 manuscript tells how Hugo Baskerville was killed by a great black hound on the moor.", ["The 1742 Manuscript", "Hugo Baskerville", "The Hound", "Dartmoor"], [1], []),
    ("The legend warns Baskervilles never to cross the moor in the dark hours.", ["The 1742 Manuscript", "Dartmoor"], [1], ["The 1742 manuscript tells how Hugo Baskerville was killed by a great black hound on the moor."]),
    ("Sir Charles believed in the legend and was afraid of the moor at night.", ["Sir Charles Baskerville", "The 1742 Manuscript"], [1, 2], ["The legend warns Baskervilles never to cross the moor in the dark hours."]),
    ("Sir Charles was found dead in the Yew Alley; the inquest said heart failure.", ["Sir Charles Baskerville", "The Yew Alley"], [1], []),
    ("Mortimer saw the footprints of a gigantic hound near Sir Charles's body and told no one at the inquest.", ["Dr. James Mortimer", "The Hound", "The Yew Alley"], [1], []),
    ("Sir Charles stood at the moor gate for several minutes on the night he died; cigar ash marked the spot.", ["Sir Charles Baskerville", "The Moor Gate"], [2], []),
    ("Sir Charles's footprints changed as if he were running on his toes.", ["Sir Charles Baskerville", "The Yew Alley"], [2], []),
    ("The hound's prints were on the path, not the grass, and the moor gate was padlocked.", ["The Hound", "The Moor Gate", "The Yew Alley"], [2], []),
    ("Sir Henry Baskerville, the heir, is coming from Canada.", ["Sir Henry Baskerville", "Baskerville Hall"], [2, 3], []),
    ("Holmes memorises the ordnance map of the moor.", ["Sherlock Holmes", "Dartmoor"], [2], []),
    ("Sir Henry received a warning letter at the Northumberland Hotel, its words cut from the Times.", ["Sir Henry Baskerville", "The Warning Letter", "The Northumberland Hotel"], [3], []),
    ("Holmes identifies the letter's type as yesterday's Times leader, pasted in haste in a hotel.", ["Sherlock Holmes", "The Warning Letter"], [3], ["Sir Henry received a warning letter at the Northumberland Hotel, its words cut from the Times."]),
    ("One of Sir Henry's new tan boots was stolen at the hotel.", ["Sir Henry's Boots", "The Northumberland Hotel"], [3], []),
    ("A bearded man in a cab followed Sir Henry and Mortimer through London.", ["Sir Henry Baskerville", "John Clayton"], [3], []),
    ("Holmes noted the spy's cab number, 2704.", ["Sherlock Holmes", "John Clayton"], [3], ["A bearded man in a cab followed Sir Henry and Mortimer through London."]),
    ("An old black boot was stolen after the tan one, and the tan boot was returned.", ["Sir Henry's Boots", "The Northumberland Hotel"], [4], ["One of Sir Henry's new tan boots was stolen at the hotel."]),
    ("Holmes cannot leave London and sends Watson to Dartmoor as Sir Henry's companion.", ["Sherlock Holmes", "Dr. John Watson", "Sir Henry Baskerville"], [4], []),
    ("Cartwright searched the hotels for a cut-up Times and found nothing.", ["Cartwright", "The Warning Letter"], [4], ["Holmes identifies the letter's type as yesterday's Times leader, pasted in haste in a hotel."]),
    ("The cabman John Clayton says his bearded fare called himself Sherlock Holmes.", ["John Clayton", "Sherlock Holmes"], [4], ["Holmes noted the spy's cab number, 2704."]),
    ("Selden, the Notting Hill murderer, has escaped from Princetown onto the moor.", ["Selden", "Dartmoor"], [5], []),
    ("Barrymore and his wife, servants at the Hall, want to leave after Sir Charles's death.", ["Barrymore", "Mrs. Barrymore", "Baskerville Hall"], [5], []),
    ("Watson hears a woman sobbing in the Hall at night.", ["Dr. John Watson", "Mrs. Barrymore", "Baskerville Hall"], [5], []),
    ("Stapleton is a naturalist who collects butterflies on the moor.", ["Jack Stapleton", "Dartmoor"], [6], []),
    ("The Grimpen Mire swallows a moor pony while Watson watches.", ["The Grimpen Mire", "Dr. John Watson"], [6], []),
    ("Stapleton claims to know a path into the heart of the Grimpen Mire.", ["Jack Stapleton", "The Grimpen Mire"], [6], []),
    ("A long moan heard over the moor is called the cry of the hound.", ["The Hound", "Dartmoor"], [6, 8], []),
    ("Beryl Stapleton, taking Watson for Sir Henry, begs him to go back to London.", ["Beryl Stapleton", "Dr. John Watson", "Sir Henry Baskerville"], [6], []),
    ("Beryl denies her warning as soon as her brother returns.", ["Beryl Stapleton", "Jack Stapleton"], [6], ["Beryl Stapleton, taking Watson for Sir Henry, begs him to go back to London."]),
    ("Sir Henry is attracted to Beryl Stapleton.", ["Sir Henry Baskerville", "Beryl Stapleton"], [7, 8], []),
    ("Stapleton resents Sir Henry's attentions to Beryl.", ["Jack Stapleton", "Sir Henry Baskerville", "Beryl Stapleton"], [7, 8], ["Sir Henry is attracted to Beryl Stapleton."]),
    ("Frankland of Lafter Hall spends his fortune on lawsuits and watches the moor through a telescope.", ["Mr. Frankland", "Lafter Hall"], [7], []),
    ("Barrymore walks to a west window at night and holds a candle to it.", ["Barrymore", "Baskerville Hall"], [7, 8], []),
    ("Barrymore's candle is a signal answered by a light on the moor.", ["Barrymore", "Dartmoor"], [8], ["Barrymore walks to a west window at night and holds a candle to it."]),
    ("Selden is Mrs. Barrymore's brother, and the Barrymores have been feeding him.", ["Selden", "Mrs. Barrymore", "Barrymore"], [8], ["Barrymore's candle is a signal answered by a light on the moor.", "Selden, the Notting Hill murderer, has escaped from Princetown onto the moor."]),
    ("Watson sees a tall thin man standing on a tor against the moon.", ["Dr. John Watson", "Dartmoor"], [8], []),
    ("Sir Charles received a letter from Coombe Tracey on the day he died, asking him to be at the gate at ten and to burn the letter, signed L. L.", ["Sir Charles Baskerville", "Laura Lyons", "Coombe Tracey", "The Moor Gate"], [9], []),
    ("L. L. is Laura Lyons, Frankland's daughter, a typist in Coombe Tracey.", ["Laura Lyons", "Mr. Frankland", "Coombe Tracey"], [9], ["Sir Charles received a letter from Coombe Tracey on the day he died, asking him to be at the gate at ten and to burn the letter, signed L. L."]),
    ("Another man, a gentleman fed by a boy, is living in the stone huts on the moor.", ["The Stone Huts", "Cartwright", "Dartmoor"], [9], []),
    ("Laura Lyons admits writing to Sir Charles but swears she never kept the appointment.", ["Laura Lyons", "Sir Charles Baskerville"], [10], ["L. L. is Laura Lyons, Frankland's daughter, a typist in Coombe Tracey."]),
    ("Frankland's telescope shows a boy carrying food to the stone huts.", ["Mr. Frankland", "Cartwright", "The Stone Huts"], [10], ["Another man, a gentleman fed by a boy, is living in the stone huts on the moor."]),
    ("The man in the stone hut is Sherlock Holmes.", ["Sherlock Holmes", "The Stone Huts"], [10], ["Watson sees a tall thin man standing on a tor against the moon.", "Frankland's telescope shows a boy carrying food to the stone huts."]),
    ("Holmes has been on the moor in secret, with Cartwright bringing supplies and Watson's reports.", ["Sherlock Holmes", "Cartwright", "The Stone Huts"], [11, 14], ["The man in the stone hut is Sherlock Holmes."]),
    ("The woman passing as Stapleton's sister is his wife.", ["Beryl Stapleton", "Jack Stapleton"], [11, 14], []),
    ("Stapleton promised Laura Lyons marriage.", ["Jack Stapleton", "Laura Lyons"], [11], []),
    ("A man is found dead below the rocks wearing Sir Henry's tweed suit.", ["Sir Henry Baskerville", "Dartmoor"], [11], []),
    ("The dead man is Selden, wearing Sir Henry's old clothes passed on by Barrymore.", ["Selden", "Barrymore", "Sir Henry Baskerville"], [11], ["A man is found dead below the rocks wearing Sir Henry's tweed suit.", "Selden is Mrs. Barrymore's brother, and the Barrymores have been feeding him."]),
    ("Stapleton is astonished to find the dead man is not Sir Henry.", ["Jack Stapleton", "Sir Henry Baskerville", "Selden"], [11], ["The dead man is Selden, wearing Sir Henry's old clothes passed on by Barrymore."]),
    ("The 1647 portrait of Hugo Baskerville has Stapleton's face.", ["The Portrait of Hugo", "Hugo Baskerville", "Jack Stapleton"], [12], []),
    ("Stapleton is a Baskerville and would inherit if Sir Henry died.", ["Jack Stapleton", "Sir Henry Baskerville", "Baskerville Hall"], [12, 14], ["The 1647 portrait of Hugo Baskerville has Stapleton's face."]),
    ("Holmes tells Sir Henry to dine at Merripit House and walk home across the moor alone.", ["Sherlock Holmes", "Sir Henry Baskerville", "Merripit House"], [12], ["Stapleton is a Baskerville and would inherit if Sir Henry died."]),
    ("Told that Stapleton is married, Laura Lyons tells Holmes everything.", ["Laura Lyons", "Jack Stapleton", "Sherlock Holmes"], [12], ["The woman passing as Stapleton's sister is his wife.", "Stapleton promised Laura Lyons marriage."]),
    ("Lestrade comes down from London for the arrest.", ["Inspector Lestrade", "Sherlock Holmes"], [12, 13], []),
    ("The hound attacks Sir Henry in the fog and Holmes shoots it dead.", ["The Hound", "Sir Henry Baskerville", "Sherlock Holmes", "The Grimpen Mire"], [13], ["Holmes tells Sir Henry to dine at Merripit House and walk home across the moor alone."]),
    ("The hound's jaws and eyes were painted with phosphorus.", ["The Hound", "Phosphorus"], [13, 14], []),
    ("Beryl is found bound and beaten in Merripit House.", ["Beryl Stapleton", "Merripit House", "Jack Stapleton"], [13], []),
    ("Stapleton flees into the Grimpen Mire and is not seen again.", ["Jack Stapleton", "The Grimpen Mire"], [13], ["The hound attacks Sir Henry in the fog and Holmes shoots it dead."]),
    ("The hound was kept on an island in the mire, where Sir Henry's boot is found.", ["The Hound", "The Grimpen Mire", "Sir Henry's Boots"], [13], []),
    ("Stapleton was the son of Rodger Baskerville, who fled to South America.", ["Jack Stapleton", "Rodger Baskerville"], [14], []),
    ("Stapleton kept a school in Yorkshire under the name Vandeleur before coming to Devon.", ["Jack Stapleton"], [14], []),
    ("Stapleton bought the hound from Ross and Mangles in the Fulham Road.", ["Jack Stapleton", "The Hound", "Ross and Mangles"], [14], []),
    ("Stapleton used Laura Lyons to bring Sir Charles to the moor gate at night.", ["Jack Stapleton", "Laura Lyons", "Sir Charles Baskerville", "The Moor Gate"], [14], ["Stapleton promised Laura Lyons marriage.", "Sir Charles received a letter from Coombe Tracey on the day he died, asking him to be at the gate at ten and to burn the letter, signed L. L."]),
    ("The glowing hound frightened Sir Charles to death at the moor gate.", ["The Hound", "Sir Charles Baskerville", "The Moor Gate", "Phosphorus"], [14], ["Stapleton used Laura Lyons to bring Sir Charles to the moor gate at night.", "Sir Charles believed in the legend and was afraid of the moor at night.", "The hound's jaws and eyes were painted with phosphorus."]),
    ("Beryl refused to lure Sir Henry and sent the warning letter herself.", ["Beryl Stapleton", "The Warning Letter", "Sir Henry Baskerville"], [14], ["The woman passing as Stapleton's sister is his wife."]),
    ("The new boot carried no scent, so Stapleton stole an old one for the hound.", ["Sir Henry's Boots", "Jack Stapleton", "The Hound"], [14], ["An old black boot was stolen after the tan one, and the tan boot was returned."]),
    ("The bearded spy in the London cab was Stapleton.", ["Jack Stapleton", "John Clayton"], [14], ["A bearded man in a cab followed Sir Henry and Mortimer through London."]),
    ("Holmes hid on the moor so that Stapleton would not know he was in the case.", ["Sherlock Holmes", "Jack Stapleton", "The Stone Huts"], [14], ["Holmes has been on the moor in secret, with Cartwright bringing supplies and Watson's reports."]),
    ("The hound killed Mortimer's spaniel on the moor.", ["The Hound", "Mortimer's Spaniel"], [14], []),
]

THREADS = [
    ("The legend of the hound", "🐕", "From Hugo's death in 1742 to a real dog painted with phosphorus: how a family story was made into a murder weapon.", [1, 2, 6, 8, 11, 13, 14]),
    ("Holmes in London and in hiding", "🕵️", "Holmes's part of the case: the deductions at Baker Street, the three broken threads, and the long weeks hidden in a stone hut on the moor.", [0, 3, 4, 10, 11, 12, 14]),
    ("Watson at Baskerville Hall", "🩺", "Watson alone as guardian and reporter: the Hall, the Stapletons, Frankland, and the candle at the window.", [5, 6, 7, 8, 9, 10]),
    ("The Barrymores and the convict", "🔪", "A sobbing woman, a signal in the night, and a murderer on the moor who turns out to be family.", [5, 7, 8, 9, 11]),
    ("Laura Lyons and the letter", "✉️", "The burned letter signed L. L., the woman who wrote it, and the man who made her.", [9, 10, 11, 12, 14]),
    ("The Stapletons", "🦋", "A naturalist and his 'sister': the courtship, the jealousy, the portrait, and the truth of who they are.", [6, 7, 8, 11, 12, 13, 14]),
]
