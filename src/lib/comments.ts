// 500 funny comments — expected NSFW, got PomHub Dev instead

const authors = [
  "WrongTabTimmy", "SearchHistorySteve", "IncognitoIan", "BookmarkBait",
  "VLCvibes", "HornyOnMain", "DisappointedDan", "NotMadJustLearning",
  "OopsAllTabs", "ThoughtThisWasPH", "ClutchingMyPearls", "PausedMySearch",
  "DNSdrama", "IPthatIP", "OrangeCurious", "ClickedForSomethingElse",
  "RemainedForCoding", "BrowserHistoryBamboozle", "CaughtIn4K", "NightShiftNode",
  "MidnightCoder", "FirefoxFolly", "ChromeTabCrisis", "EdgeCaseEddy",
  "SafariSurprise", "BingBongBait", "DuckDuckGoneWild", "BraveBrowserEnergy",
  "TorButNotThatTor", "ProxyPal", "VPNVanessa", "CookieConsentChris",
  "AdBlockAdam", "ScriptKiddieSam", "DarkWebDerek", "LightModeLarry",
  "PopUpPete", "NotABotTrustMe", "CtrlAltDelusion", "ShiftKeyFantasy",
  "AltTabAddict", "SpaceBarSpacer", "EnterKeyEnergy", "EscapeAttempt",
  "DeleteHistoryDave", "ClearCacheCarl", "PrivateBrowsingPaul", "GuestModeGreg",
  "FamilyFilterFrank", "PasswordPete", "AutoFillAdam",
];

const nsfwBaitTexts = [
  "I came here looking for something else. Now I'm learning Python. Thanks I guess?",
  "My search history was 'free videos' and now I'm watching a Docker tutorial. The algorithm works in mysterious ways.",
  "I've been tricked, I've been backstabbed, and I've been quite literally bamboozled. But I'm actually learning something so I'll stay.",
  "The orange color scheme had me suspicious for a second. Now I'm 45 minutes deep into subnetting.",
  "Bold of you to assume I closed my other tabs.",
  "I typed 'hot content' into Google and ended up learning about Kubernetes. Life is strange.",
  "This is NOT what I searched for but I can't look away.",
  "My Incognito tab is very confused right now.",
  "I clicked expecting a completely different kind of video. The only thing getting exposed here is my lack of networking knowledge.",
  "I feel like I walked into the wrong room but the lecture is too good to leave.",
  "PomHub Dev is the least expected plot twist of my night.",
  "The algorithm really said 'you keep searching for that, but here's how to configure a switch instead.'",
  "My browser history is going to be very confusing for anyone who checks it. 'Full course — then... more full courses.'",
  "I was looking for something explicit. All I found was an implicit understanding of CIDR notation.",
  "This is the greatest bait-and-switch since 'I'm just going to check one thing' and now it's 3am.",
  "I'm not saying I closed the wrong tab, but I'm also not saying I didn't.",
  "Who else clicked on this by 'accident' and then stayed for the content? Just me?",
  "I have 47 tabs open. I don't know which one this is. But I'm watching it.",
  "My search history is a mess but honestly? This was a net positive.",
  "I thought I was getting a late-night snack. Got a full course on routing protocols instead.",
  "Someone check on my search history. It's having an identity crisis.",
  "I've made a huge mistake. No wait, this is actually useful.",
  "I was NOT ready for this level of education today.",
  "This better not show up on my recommended feed at work.",
  "The YouTube algorithm and I need to have a conversation about assumptions.",
  "I feel personally attacked by how educational this is.",
  "I typed one thing into the search bar and now I'm learning JavaScript modules. The pipeline is broken.",
  "This is the worst case of mistaken identity since I thought I was getting free movies.",
  "I have no idea how I got here but I've already learned more than I expected.",
  "My Incognito mode just filed a complaint. It expected different content.",
  "The only thing NSFW about this is how dangerously productive I'm becoming.",
  "I came for the orange and black aesthetic. Stayed for the free CCNA course.",
  "My search history just went from questionable to Certified Network Associate.",
  "I thought the 'hub' in PomHub meant something else. I was wrong. But I'm not leaving.",
  "Every time I think I'm about to waste time, I end up learning something. Stop being so useful.",
  "I opened this in a private window for no reason. This is pure, educational content. My paranoia is showing.",
  "I was going to close this after 10 seconds. That was 3 hours ago.",
  "This is the best accident since penicillin.",
  "I feel like I owe my ISP an apology for the search history I was about to create. Anyway, back to VLANs.",
  "My bookmarks folder is going to be very confused when I name this 'Not What It Looks Like'.",
  "I keep waiting for the 'adult content' disclaimer. It never comes. Just pure networking knowledge.",
  "I came for the memes, stayed for the TCP/IP deep dive.",
  "This is the most productive 'wrong turn' I've ever taken.",
  "My boss just walked by and saw me watching a tutorial. For once, I wasn't hiding it.",
  "I can't decide if I'm disappointed or relieved. Either way, I now understand Docker Compose.",
  "The only thing getting 'served' here is educational content. And I'm here for it.",
  "My girlfriend asked what I'm watching. I said 'not what you think' which is technically true.",
  "This is the least scandalous thing in my browser history and it's the only one I'm proud of.",
];

const channelInsideJokes: Record<string, string[]> = {
  NetworkChuck: [
    "NetworkChuck's coffee intake is a security risk by itself.",
    "Chuck makes me want to rewire my house at 2am and I don't even own a house.",
    "I came for the title, stayed because Chuck's energy is contagious.",
    "NetworkChuck could make reading a router manual sound exciting.",
    "Chuck's keyboard is getting more action tonight than I am.",
    "I showed up for the thumbnail, stayed for Chuck's enthusiasm.",
    "NetworkChuck is why I have a homelab. And a caffeine addiction.",
    "Every time Chuck says 'watch this' I know something is about to break and I love it.",
    "Chuck is the only person who can make me excited about fiber optics.",
    "I don't know what's more impressive — the networking knowledge or the caffeine tolerance.",
  ],
  Fireship: [
    "Fireship explained this in 100 seconds. I've been here for 3 hours.",
    "I feel personally attacked by how efficient this explanation is.",
    "Fire speaks so fast I can't tell if I'm learning or being hypnotized.",
    "This video is 100 seconds long and I've paused it 47 times to take notes.",
    "Fireship's 100 seconds = my 2 weeks of study. Feels bad man.",
    "I came for the 100 seconds meme, stayed for the actual knowledge drop.",
    "Fire's editing is so good I'd watch a 100-second video about paint drying.",
    "Every Fireship video makes me feel like I'm behind on everything. Thanks for that.",
    "The pace of this video is my cardio for the day.",
    "Fireship in 100 seconds = me trying to explain what I learned in 100 minutes.",
  ],
  freeCodeCamp: [
    "This is 4 hours long and it's free. freeCodeCamp is literally giving away education.",
    "I came for the free stuff. Found a full career path instead.",
    "freeCodeCamp putting out bangers again. This should cost money.",
    "The fact that this full course is free makes me question my university tuition.",
    "freeCodeCamp is carrying the dev community on its back. For free.",
    "I owe freeCodeCamp my career. And probably my mental health too.",
    "This is better than most paid courses. And it's free. Make it make sense.",
    "freeCodeCamp is the public library of the internet. Undefeated.",
    "I've learned more from this free video than my entire bootcamp.",
    "Who needs Netflix when freeCodeCamp drops 4-hour courses for free?",
  ],
  TechWorldWithNana: [
    "Nana made Kubernetes make sense. That's like making quantum physics sound easy.",
    "I came for DevOps, I stayed because Nana's accent makes everything sound official.",
    "Nana's roadmap videos are better therapy than actual therapy.",
    "I showed up not knowing what a pod is. Now I'm deploying clusters.",
    "Nana's Docker tutorial changed my life. And my deployment pipeline.",
    "I thought DevOps was a job title. Turns out it's a lifestyle Nana teaches for free.",
    "Nana's explanations are so clear I understood containers on the first watch. A miracle.",
    "I came for the tech, stayed for Nana's ability to make complex things simple.",
    "Every time Nana says 'let me show you' I know I'm about to have a breakthrough.",
    "Nana's courses should come with a warning: 'may change career trajectory.'",
  ],
  TraversyMedia: [
    "Brad is the reason I'm a developer. Thanks for the career, Brad.",
    "Traversy Media has been carrying web dev tutorials for a decade. Legend.",
    "I've been watching Brad since he had 10k subs. Now I have a job because of him.",
    "Brad's crash courses are the closest thing to a coding bootcamp without the price tag.",
    "I came for 'Build a [something]' and got an actual career.",
    "Traversy Media is the GOAT. No debate.",
    "Every Brad video is perfectly paced. Not too fast, not too slow. Goldilocks of tutorials.",
    "I've learned more from Brad's full-stack series than my 4-year degree.",
    "Brad's consistency over the years is unmatched. Still dropping quality content.",
    "I remember when Traversy Media had a different background. OG fans know.",
  ],
  NetNinja: [
    "Net Ninja's playlists are more organized than my entire life.",
    "I love how Net Ninja numbers every video. It scratches an itch in my brain.",
    "Net Ninja's React series literally taught me React. From zero to hero.",
    "The black background + colored syntax is peak tutorial aesthetic.",
    "Net Ninja doesn't miss. Every series is gold.",
    "I went through the entire 50-video playlist in one weekend. No regrets.",
    "Net Ninja's tutorials are the most structured on YouTube. Period.",
    "I wish my Netflix was organized like Net Ninja's playlists.",
    "Net Ninja's consistency is unreal. Dropping bangers for years.",
    "The way Net Ninja structures content should be taught in schools.",
  ],
  coreyms: [
    "Corey Schafer is the reason I understand Python. And Git. And life.",
    "I miss Corey's uploads but his existing content is timeless.",
    "Corey's Python series is the gold standard. Everything else is silver.",
    "I learned more from Corey's Git tutorial than from actually using Git for a year.",
    "Corey's voice is so calming I could listen to him explain database normalization for hours.",
    "Corey's teaching pace is perfect for deep understanding. No fluff.",
    "The Python OOP series by Corey should be mandatory viewing.",
    "Corey makes terminal commands feel like poetry. Almost.",
    "Every time I Google a Python question, Corey already answered it.",
    "Corey's Django series taught me full-stack development. Legend.",
  ],
  TechWithTim: [
    "Tim makes Python projects that are actually fun. Not another calculator app.",
    "Tech With Tim's project tutorials are perfect for my portfolio. And my resume.",
    "I built my first real project following Tim. It actually worked. Shocking.",
    "Tim's variety is insane. Web dev, ML, game dev — what can't he teach?",
    "I came for the Python tutorials, stayed for Tim's game dev content.",
    "Tim's machine learning tutorials made ML actually make sense. Black magic.",
    "Tech With Tim is underrated for how much quality content he pumps out.",
    "Tim's tutorials are well-paced. Not too fast, doesn't waste time. Perfect.",
    "I appreciate how Tim covers both beginner and advanced topics.",
    "Tim's project-based teaching is exactly how I learn best.",
  ],
  WebDevSimplified: [
    "Kyle explains things so simply I feel stupid for not knowing it before.",
    "Web Dev Simplified is the most accurate channel name on YouTube.",
    "Kyle doesn't waste a single second. Straight to the point. Respect.",
    "Every time I struggle with JS, Kyle has a 10-minute video that fixes everything.",
    "Kyle's CSS videos are what finally made CSS make sense. It only took 5 years.",
    "I watch Web Dev Simplified at 1.5x and still understand everything. That's how clear he is.",
    "Kyle's 'Learn X in Y Minutes' format is peak tutorial efficiency.",
    "Web Dev Simplified is criminally underrated. Kyle deserves more recognition.",
    "I've recommended Kyle's channel to every developer I know. All of them thanked me.",
    "Kyle makes complex React patterns feel obvious. That's a superpower.",
  ],
  ByteByteGo: [
    "ByteByteGo's animations make system design feel like a Pixar movie.",
    "I watch ByteByteGo before interviews. Haven't failed one yet. Coincidence?",
    "ByteByteGo is the only channel where I watch the whole video AND understand it.",
    "The animation quality on ByteByteGo is insane. Who does their motion graphics?",
    "I wish my university lectures were ByteByteGo animations. I'd have a PhD by now.",
    "ByteByteGo explains distributed systems in 5 minutes better than a textbook in 5 chapters.",
    "Every ByteByteGo video makes me feel like I understand the entire internet.",
    "The visual explanations are so good I feel like I'm watching a nature documentary.",
    "ByteByteGo animations > Hollywood CGI. Change my mind.",
    "I came for system design, stayed because the animations are hypnotic.",
  ],
};

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomTimeAgo(): string {
  const units = [
    { value: randInt(1, 59), word: 'minute' },
    { value: randInt(1, 23), word: 'hour' },
    { value: randInt(1, 30), word: 'day' },
    { value: randInt(1, 11), word: 'month' },
    { value: 1, word: 'year' },
  ];
  const u = pick(units);
  const val = u.value;
  return `${val} ${u.word}${val > 1 ? 's' : ''} ago`;
}

function generateComments(count: number): { author: string; avatarLetter: string; text: string; likes: number; replies: number; createdAt: string }[] {
  const result: ReturnType<typeof generateComments> = [];

  for (let i = 0; i < count; i++) {
    const author = pick(authors);
    const avatarLetter = author.charAt(0).toUpperCase();
    const createdAt = randomTimeAgo();
    const likes = randInt(1, 500);
    const replies = Math.random() > 0.6 ? randInt(1, 15) : 0;

    // 15% chance to be a channel inside joke
    let text: string;
    if (Math.random() < 0.15) {
      const channels = Object.keys(channelInsideJokes);
      const channel = pick(channels);
      text = pick(channelInsideJokes[channel]);
    } else {
      text = pick(nsfwBaitTexts);
    }

    result.push({
      author,
      avatarLetter,
      text,
      likes,
      replies,
      createdAt,
    });
  }

  return result;
}

export const ALL_COMMENTS = generateComments(500);
