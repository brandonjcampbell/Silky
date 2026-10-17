# A Christmas Carol (Charles Dickens, 1843). Public domain.
STAMP = "carol1843"
TITLE = "A Christmas Carol"
BLURB = "Dickens's ghost story in five staves, modelled scene by scene: one night, three spirits, and a man remade. Scenes hold synopses; fetch the text with Import → Gutenberg 46."
NOTE = "This scene holds a synopsis in place of Dickens's text. To bring in the original, use Import manuscript with Project Gutenberg book 46."

ELEMENTS = [
    ("Ebenezer Scrooge", "🧓", "A tight-fisted, solitary old moneylender; hard and sharp as flint, secret and self-contained as an oyster."),
    ("Jacob Marley", "⛓️", "Scrooge's dead partner, seven years gone; returns in chains forged of cash-boxes and ledgers."),
    ("Bob Cratchit", "🧣", "Scrooge's clerk on fifteen shillings a week, with a thin coat and a large family."),
    ("Tiny Tim", "🩼", "Bob's small lame son, who hopes the people in church will remember who made lame beggars walk."),
    ("Fred", "🎄", "Scrooge's cheerful nephew, who keeps Christmas and keeps inviting his uncle to dinner."),
    ("Fan", "👧", "Scrooge's little sister, who fetched him home from school; Fred's late mother."),
    ("Mr. Fezziwig", "🎻", "Scrooge's old master, a warm-hearted man who threw a Christmas ball for the whole warehouse."),
    ("Belle", "💍", "Scrooge's former fiancée, who released him when she saw that gold had replaced her."),
    ("The Ghost of Christmas Past", "🕯️", "A strange childlike figure with a bright jet of light from its head and a cap to put it out."),
    ("The Ghost of Christmas Present", "🎁", "A jolly giant in a green robe on a throne of food, with a torch that blesses dinners."),
    ("The Ghost of Christmas Yet to Come", "🩶", "A silent phantom shrouded in black, pointing with one hand."),
    ("Mrs. Cratchit", "🍮", "Bob's wife, who makes a Christmas pudding like a speckled cannon-ball and will not drink Scrooge's health gladly."),
    ("Martha Cratchit", "👒", "The eldest Cratchit daughter, apprenticed at a milliner's."),
    ("Peter Cratchit", "👔", "Bob's son, wearing his father's enormous shirt-collar and looking for a situation."),
    ("Dick Wilkins", "🤝", "Scrooge's fellow apprentice at Fezziwig's."),
    ("The Charity Gentlemen", "🎩", "Two portly gentlemen collecting for the poor at Christmas."),
    ("Old Joe", "🧺", "A rag-and-bone dealer who buys the dead man's belongings."),
    ("Mrs. Dilber", "🧹", "A laundress who strips the dead man's room and sells his things."),
    ("Caroline", "😮‍💨", "A debtor's wife relieved to hear that the man they owed has died."),
    ("Ignorance and Want", "👦", "Two wretched children hidden in the robe of Christmas Present; beware the boy most of all."),
    ("The Counting-House", "🏢", "Scrooge's place of business, where a single coal warms the clerk."),
    ("Scrooge's Rooms", "🚪", "The gloomy chambers that once were Marley's, up a dark staircase."),
    ("Marley's Door-Knocker", "🔔", "The knocker that becomes Marley's face."),
    ("The School", "🏫", "The dreary boarding school where a boy was left alone at Christmas."),
    ("Fezziwig's Warehouse", "🏭", "The warehouse cleared for dancing on Christmas Eve."),
    ("The Cratchit House", "🏠", "Four rooms in Camden Town, full of family."),
    ("Fred's House", "🏡", "Where Scrooge's nephew plays blind-man's buff and Yes and No."),
    ("The Churchyard", "🪦", "An overgrown graveyard with a neglected stone."),
    ("The Prize Turkey", "🦃", "The bird twice the size of Tiny Tim, sent to the Cratchits."),
    ("Christmas Eve", "🌙", "The night it all happens, in one sleep."),
]

def p(*paras): return list(paras)

SCENES = [
    ("Stave One (1) · The counting-house", p(
        "Marley is dead, to begin with — seven years to the day. Scrooge, his surviving partner, sits in his counting-house on a cold, foggy Christmas Eve while Bob Cratchit shivers over a single coal in the next room.",
        "Scrooge's nephew Fred bursts in with a merry Christmas and is told it is humbug; two gentlemen collecting for the poor are asked whether the prisons and workhouses are still in operation. Scrooge grudgingly gives Bob the whole of Christmas Day.")),
    ("Stave One (2) · Marley's Ghost", p(
        "At his own front door Scrooge sees the knocker become Marley's face. Inside, every bell in the house rings, chains drag up the stairs, and Marley's Ghost comes through the closed door — transparent, bound in a chain of cash-boxes, keys, padlocks and ledgers.",
        "Marley wears the chain he forged in life and warns Scrooge that his own is longer. He has procured Scrooge a chance: three spirits will visit, the first when the bell tolls one. Through the window Scrooge sees the air filled with phantoms in chains, powerless to help the living.")),
    ("Stave Two (1) · The first of the three spirits", p(
        "The bell tolls one and the curtains of the bed are drawn by a strange figure, child and old man at once, with a jet of light springing from its head and a cap under its arm. It is the Ghost of Christmas Past — Scrooge's past.",
        "They pass through the wall into the country of Scrooge's boyhood. He knows every gate and tree, and weeps to see boys he knew calling merry Christmas to one another.")),
    ("Stave Two (2) · The schoolroom and Fan", p(
        "In a bare schoolroom a solitary boy reads by a feeble fire while the others have gone home for Christmas; Ali Baba and Robinson Crusoe keep him company. Scrooge sobs for his younger self and thinks of the carol-singer he turned away.",
        "Another Christmas: his little sister Fan runs in to bring him home — Father is kinder now. The Ghost reminds him that Fan died a woman, and left one child: his nephew.")),
    ("Stave Two (3) · Fezziwig's ball", p(
        "Old Fezziwig, in his Welsh wig, has the warehouse cleared for a Christmas Eve ball. The fiddler plays, the Fezziwig daughters dance, there are cakes and cold roast and mince pies, and young Scrooge and Dick Wilkins are as happy as any.",
        "The Ghost remarks that Fezziwig spent but a few pounds to earn such gratitude. Scrooge answers that the happiness he gave was as great as if it cost a fortune — and thinks of his own clerk.")),
    ("Stave Two (4) · Belle", p(
        "Scrooge in his prime, with the signs of avarice already in his face, sits with a fair young woman in mourning. Belle tells him another idol has displaced her — a golden one — and releases him from their engagement, for he would not choose a dowerless girl now.",
        "Years on, Belle is a matron in a house full of children, and her husband tells her he saw Scrooge alone in his office while his partner lay dying. Scrooge begs the Ghost to show him no more and presses the cap down over its light.")),
    ("Stave Three (1) · The Ghost of Christmas Present", p(
        "Scrooge wakes to a room transformed: holly, ivy and mistletoe on the walls, a roaring fire, and a throne of turkeys, geese, puddings and punch, on which sits a jolly giant in a green robe — the Ghost of Christmas Present.",
        "The Ghost takes him through the Christmas-morning streets, where it sprinkles incense from its torch on the dinners of the poor, and particularly on the poorest.")),
    ("Stave Three (2) · The Cratchits' Christmas", p(
        "In Camden Town the Cratchits prepare their dinner: Mrs. Cratchit in ribbons, Martha home from the milliner's, Peter in his father's collar, and Bob carrying Tiny Tim on his shoulder with his little crutch. The goose is a wonder; the pudding is a speckled cannon-ball blazing in brandy.",
        "Bob proposes Mr. Scrooge, the founder of the feast, and Mrs. Cratchit drinks it only for the day's sake. Scrooge asks whether Tiny Tim will live; the Ghost sees a vacant seat and a crutch without an owner, and throws Scrooge's own words about surplus population back at him.")),
    ("Stave Three (3) · Fred's party", p(
        "Across London Fred and his friends laugh at Scrooge's humbug and play forfeits and blind-man's buff. In the game of Yes and No the answer turns out to be Uncle Scrooge, a savage animal that growls and grunts and lives in London.",
        "Fred drinks his uncle's health all the same. Scrooge, unseen, has grown so light of heart that he would have joined in.")),
    ("Stave Three (4) · Ignorance and Want", p(
        "The Ghost grows old in a night. From the folds of its robe come two children, wretched, ragged and wolfish — a boy and a girl. They are Man's: the boy is Ignorance, the girl is Want. Beware them both, and most of all the boy, on whose brow is written Doom.",
        "Scrooge asks whether they have no refuge, and hears his own words: are there no prisons, no workhouses? The bell strikes twelve and the Ghost is gone.")),
    ("Stave Four (1) · The last of the spirits", p(
        "A phantom shrouded in black, with nothing visible but one outstretched hand, approaches without a word. Scrooge fears it more than any spectre he has seen, but follows, hoping to live to be another man.",
        "On 'Change, businessmen discuss a death with idle unconcern — a cheap funeral, nobody to go to it. Scrooge cannot see himself in his accustomed corner.")),
    ("Stave Four (2) · Old Joe's shop", p(
        "In a low den a charwoman, a laundress and an undertaker's man sell the dead man's belongings to Old Joe: his blankets, his shirt taken off his body, even the bed-curtains, rings and all. He frightened everyone away in life, they say, and so profited them in death.",
        "The Ghost shows Scrooge the plundered bed with the body under a sheet. He cannot bring himself to lift the cover. He asks to see some tenderness connected with the death, and is shown a family — Caroline and her husband — relieved that their merciless creditor has died.")),
    ("Stave Four (3) · The Cratchits without Tim", p(
        "The Cratchit house is very quiet. Peter reads aloud; Mrs. Cratchit's eyes are weak from working by candlelight. Bob comes home from the churchyard where he has promised to walk every Sunday, and goes upstairs to a little chair beside a small body.",
        "Fred has been kind to Bob in the street. Bob tells the family they will none of them forget poor Tiny Tim, or this first parting among them.")),
    ("Stave Four (4) · The grave", p(
        "The Ghost leads Scrooge to a churchyard choked with weeds and points to a neglected stone. Scrooge asks whether these are the shadows of things that will be, or only of things that may be — and reads his own name: Ebenezer Scrooge.",
        "He clutches the spectre's hand and swears to honour Christmas in his heart and live in the Past, the Present and the Future. The phantom shrinks and collapses into a bedpost.")),
    ("Stave Five · The end of it", p(
        "It is Christmas morning and Scrooge is alive, laughing and crying at once. He sends a boy for the prize turkey at the poulterer's — twice the size of Tiny Tim — and dispatches it to Bob Cratchit's; he gives the charity gentleman a great sum with back-payments; he goes to church, and then to Fred's, where he is welcomed to dinner.",
        "Next morning he catches Bob coming in late, pretends his old growl, and raises his salary. He becomes a second father to Tiny Tim, who does not die, and as good a man as the good old city knew. God bless Us, Every One!")),
]

FACTS = [
    ("Jacob Marley has been dead seven years, to the very day.", ["Jacob Marley", "Ebenezer Scrooge", "Christmas Eve"], [0], []),
    ("Scrooge was Marley's sole partner, executor, legatee and mourner.", ["Ebenezer Scrooge", "Jacob Marley"], [0], []),
    ("Bob Cratchit works for Scrooge on fifteen shillings a week in a cold cell warmed by one coal.", ["Bob Cratchit", "Ebenezer Scrooge", "The Counting-House"], [0], []),
    ("Fred invites Scrooge to Christmas dinner every year and is refused.", ["Fred", "Ebenezer Scrooge"], [0], []),
    ("Scrooge asks the charity gentlemen whether the prisons and workhouses are still in operation.", ["Ebenezer Scrooge", "The Charity Gentlemen"], [0], []),
    ("Scrooge says the poor who would rather die had better do it and decrease the surplus population.", ["Ebenezer Scrooge", "The Charity Gentlemen"], [0], []),
    ("Scrooge grants Bob the whole of Christmas Day, grudgingly.", ["Ebenezer Scrooge", "Bob Cratchit"], [0], []),
    ("Scrooge sees Marley's face in his door-knocker.", ["Ebenezer Scrooge", "Marley's Door-Knocker", "Jacob Marley"], [1], []),
    ("Scrooge lives in Marley's old rooms, up a dark staircase.", ["Ebenezer Scrooge", "Scrooge's Rooms", "Jacob Marley"], [1], []),
    ("Marley's Ghost wears a chain of cash-boxes, keys, padlocks and ledgers.", ["Jacob Marley"], [1], []),
    ("Marley forged his chain link by link in life and says Scrooge's is longer.", ["Jacob Marley", "Ebenezer Scrooge"], [1], ["Marley's Ghost wears a chain of cash-boxes, keys, padlocks and ledgers."]),
    ("Marley has procured Scrooge a chance: three spirits will visit him.", ["Jacob Marley", "Ebenezer Scrooge"], [1], ["Marley forged his chain link by link in life and says Scrooge's is longer."]),
    ("The first spirit will come when the bell tolls one.", ["Jacob Marley", "The Ghost of Christmas Past"], [1, 2], ["Marley has procured Scrooge a chance: three spirits will visit him."]),
    ("The air outside is full of chained phantoms unable to help the living.", ["Jacob Marley", "Scrooge's Rooms"], [1], []),
    ("The Ghost of Christmas Past looks like a child and an old man at once, with light springing from its head.", ["The Ghost of Christmas Past"], [2], []),
    ("The Ghost of Christmas Past shows Scrooge's own past.", ["The Ghost of Christmas Past", "Ebenezer Scrooge"], [2], ["The first spirit will come when the bell tolls one."]),
    ("As a boy Scrooge was left alone at school over Christmas.", ["Ebenezer Scrooge", "The School"], [3], []),
    ("Scrooge weeps for his younger self and regrets turning away a carol-singer.", ["Ebenezer Scrooge", "The School"], [3], ["As a boy Scrooge was left alone at school over Christmas."]),
    ("Fan came to bring Scrooge home from school because Father had grown kinder.", ["Fan", "Ebenezer Scrooge", "The School"], [3], []),
    ("Fan died a woman and left one child, Fred.", ["Fan", "Fred"], [3], []),
    ("Scrooge was apprenticed to Fezziwig alongside Dick Wilkins.", ["Ebenezer Scrooge", "Mr. Fezziwig", "Dick Wilkins", "Fezziwig's Warehouse"], [4], []),
    ("Fezziwig gave a Christmas Eve ball for everyone in the warehouse.", ["Mr. Fezziwig", "Fezziwig's Warehouse"], [4], []),
    ("Scrooge argues that Fezziwig's power to make his people happy was worth a fortune, and thinks of his clerk.", ["Ebenezer Scrooge", "Mr. Fezziwig", "Bob Cratchit"], [4], ["Fezziwig gave a Christmas Eve ball for everyone in the warehouse."]),
    ("Belle released Scrooge from their engagement because a golden idol had displaced her.", ["Belle", "Ebenezer Scrooge"], [5], []),
    ("Belle married another man and has a house full of children.", ["Belle"], [5], ["Belle released Scrooge from their engagement because a golden idol had displaced her."]),
    ("Belle's husband saw Scrooge alone in his office while Marley lay dying.", ["Belle", "Ebenezer Scrooge", "Jacob Marley"], [5], []),
    ("Scrooge presses the extinguisher-cap down over the Ghost of Christmas Past's light.", ["Ebenezer Scrooge", "The Ghost of Christmas Past"], [5], []),
    ("The Ghost of Christmas Present is a jolly giant in a green robe on a throne of food.", ["The Ghost of Christmas Present"], [6], []),
    ("The Ghost of Christmas Present blesses the dinners of the poor with incense from its torch.", ["The Ghost of Christmas Present"], [6], []),
    ("The Cratchits live in four rooms in Camden Town.", ["Bob Cratchit", "Mrs. Cratchit", "The Cratchit House"], [7], []),
    ("Tiny Tim is lame and walks with a crutch and an iron frame.", ["Tiny Tim"], [7], []),
    ("Tiny Tim hoped the people in church would remember who made lame beggars walk and blind men see.", ["Tiny Tim", "Bob Cratchit"], [7], []),
    ("Martha is apprenticed at a milliner's; Peter wears his father's collar and seeks a situation.", ["Martha Cratchit", "Peter Cratchit", "Bob Cratchit"], [7], []),
    ("Mrs. Cratchit will drink Scrooge's health only for the day's sake.", ["Mrs. Cratchit", "Ebenezer Scrooge", "Bob Cratchit"], [7], ["Bob Cratchit works for Scrooge on fifteen shillings a week in a cold cell warmed by one coal."]),
    ("The Ghost says Tiny Tim will die unless the shadows are altered.", ["The Ghost of Christmas Present", "Tiny Tim"], [7], ["Tiny Tim is lame and walks with a crutch and an iron frame."]),
    ("The Ghost turns Scrooge's words about surplus population against him.", ["The Ghost of Christmas Present", "Ebenezer Scrooge"], [7, 9], ["Scrooge says the poor who would rather die had better do it and decrease the surplus population."]),
    ("Fred's guests play Yes and No, and the answer is Uncle Scrooge.", ["Fred", "Fred's House", "Ebenezer Scrooge"], [8], []),
    ("Fred drinks his uncle's health despite everything.", ["Fred", "Ebenezer Scrooge"], [8], ["Fred invites Scrooge to Christmas dinner every year and is refused."]),
    ("The Ghost of Christmas Present ages and dies within the night.", ["The Ghost of Christmas Present", "Christmas Eve"], [9], []),
    ("Ignorance and Want are two wretched children hidden in the Ghost's robe; the boy is the more dangerous.", ["Ignorance and Want", "The Ghost of Christmas Present"], [9], []),
    ("The Ghost of Christmas Yet to Come is shrouded and silent and points with one hand.", ["The Ghost of Christmas Yet to Come"], [10], []),
    ("Businessmen on 'Change discuss a death with no one willing to attend the funeral.", ["The Ghost of Christmas Yet to Come", "Ebenezer Scrooge"], [10], []),
    ("Mrs. Dilber and others sell the dead man's belongings, even his bed-curtains and shirt, to Old Joe.", ["Mrs. Dilber", "Old Joe"], [11], []),
    ("The dead man frightened everyone away in life, so he was plundered in death.", ["Old Joe", "Mrs. Dilber"], [11], ["Mrs. Dilber and others sell the dead man's belongings, even his bed-curtains and shirt, to Old Joe."]),
    ("Caroline and her husband are relieved that their merciless creditor has died.", ["Caroline"], [11], []),
    ("Tiny Tim has died, and Bob visits his grave every Sunday.", ["Tiny Tim", "Bob Cratchit", "The Cratchit House"], [12], ["The Ghost says Tiny Tim will die unless the shadows are altered."]),
    ("Fred was kind to Bob in the street after Tim's death.", ["Fred", "Bob Cratchit"], [12], []),
    ("The neglected grave bears the name Ebenezer Scrooge.", ["Ebenezer Scrooge", "The Churchyard", "The Ghost of Christmas Yet to Come"], [13], ["Businessmen on 'Change discuss a death with no one willing to attend the funeral.", "The dead man frightened everyone away in life, so he was plundered in death."]),
    ("Scrooge swears to honour Christmas and live in the Past, the Present and the Future.", ["Ebenezer Scrooge", "The Ghost of Christmas Yet to Come"], [13], ["The neglected grave bears the name Ebenezer Scrooge.", "Tiny Tim has died, and Bob visits his grave every Sunday."]),
    ("The phantom shrinks into a bedpost and Scrooge wakes in his own bed on Christmas morning.", ["Ebenezer Scrooge", "The Ghost of Christmas Yet to Come", "Scrooge's Rooms"], [13, 14], ["Scrooge swears to honour Christmas and live in the Past, the Present and the Future."]),
    ("Scrooge sends the prize turkey, twice the size of Tiny Tim, to the Cratchits anonymously.", ["Ebenezer Scrooge", "The Prize Turkey", "Bob Cratchit", "Tiny Tim"], [14], ["Scrooge swears to honour Christmas and live in the Past, the Present and the Future."]),
    ("Scrooge gives the charity gentleman a large sum including back-payments.", ["Ebenezer Scrooge", "The Charity Gentlemen"], [14], ["Scrooge asks the charity gentlemen whether the prisons and workhouses are still in operation.", "Scrooge swears to honour Christmas and live in the Past, the Present and the Future."]),
    ("Scrooge goes to Fred's for Christmas dinner at last.", ["Ebenezer Scrooge", "Fred", "Fred's House"], [14], ["Fred invites Scrooge to Christmas dinner every year and is refused.", "Scrooge swears to honour Christmas and live in the Past, the Present and the Future."]),
    ("Scrooge raises Bob's salary and promises to help his family.", ["Ebenezer Scrooge", "Bob Cratchit", "The Counting-House"], [14], ["Scrooge argues that Fezziwig's power to make his people happy was worth a fortune, and thinks of his clerk.", "Scrooge swears to honour Christmas and live in the Past, the Present and the Future."]),
    ("Tiny Tim does not die, and Scrooge becomes a second father to him.", ["Tiny Tim", "Ebenezer Scrooge"], [14], ["Scrooge raises Bob's salary and promises to help his family.", "The Ghost says Tiny Tim will die unless the shadows are altered."]),
    ("Everything happens in a single night, though Scrooge lived three Christmases in it.", ["Christmas Eve", "Ebenezer Scrooge"], [14], []),
]

THREADS = [
    ("Marley's warning", "⛓️", "The dead partner's visit and what it sets in motion.", [0, 1, 14]),
    ("Christmas Past", "🕯️", "The schoolroom, Fan, Fezziwig's ball and Belle: how Scrooge became Scrooge.", [2, 3, 4, 5]),
    ("Christmas Present", "🎁", "Christmas as it is being kept, by the Cratchits, by Fred, and by Ignorance and Want.", [6, 7, 8, 9]),
    ("Christmas Yet to Come", "🩶", "A death nobody mourns, and whose it is.", [10, 11, 12, 13]),
    ("The Cratchits", "🧣", "Bob's family across three Christmases: the goose, the empty chair, the turkey.", [0, 7, 12, 14]),
    ("Scrooge and Fred", "🎄", "An invitation refused, a health drunk, a dinner finally eaten.", [0, 3, 8, 14]),
]
