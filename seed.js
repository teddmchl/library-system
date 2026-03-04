require("dotenv").config();
const mongoose = require("mongoose");
const Book = require("./models/Book");
const Member = require("./models/Member");
const Loan = require("./models/Loan");

const BOOKS = [
  { title: "Middlemarch", author: "George Eliot", isbn: "978-0-14-043547-1", genre: "Fiction", publisher: "Penguin Classics", publishedYear: 1871, pages: 880, copies: 2, description: "A sweeping portrait of English provincial life in the 1830s, following the idealistic Dorothea Brooke and the ambitious young doctor Tertius Lydgate.", coverColor: "#6b4a3d", location: "Fiction E" },
  { title: "The Brothers Karamazov", author: "Fyodor Dostoevsky", isbn: "978-0-14-044924-9", genre: "Fiction", publisher: "Penguin Classics", publishedYear: 1880, pages: 796, copies: 1, description: "Dostoevsky's final novel explores spiritual struggle, free will, and moral responsibility through the story of the Karamazov family.", coverColor: "#2c4a6e", location: "Fiction D" },
  { title: "Sapiens: A Brief History of Humankind", author: "Yuval Noah Harari", isbn: "978-0-06-231609-7", genre: "History", publisher: "Harper", publishedYear: 2011, pages: 443, copies: 3, description: "An exploration of how Homo sapiens came to dominate the planet, from the cognitive revolution to the present day.", coverColor: "#8b7355", location: "History H" },
  { title: "The Remains of the Day", author: "Kazuo Ishiguro", isbn: "978-0-679-73172-5", genre: "Fiction", publisher: "Vintage", publishedYear: 1989, pages: 245, description: "A butler's slow awakening to the personal costs of devotion to duty, told during a motoring trip through England.", coverColor: "#5c7a5c", location: "Fiction I", copies: 2 },
  { title: "Thinking, Fast and Slow", author: "Daniel Kahneman", isbn: "978-0-374-53355-7", genre: "Non-Fiction", publisher: "Farrar, Straus and Giroux", publishedYear: 2011, pages: 499, copies: 2, description: "A groundbreaking exploration of the two systems that drive the way we think — and how we can harness them.", coverColor: "#3a5a78", location: "Non-Fiction K" },
  { title: "One Hundred Years of Solitude", author: "Gabriel García Márquez", isbn: "978-0-06-088328-7", genre: "Fiction", publisher: "Harper Perennial", publishedYear: 1967, pages: 422, description: "The multi-generational story of the Buendía family in the mythical town of Macondo — a masterwork of magical realism.", coverColor: "#7a4f2d", location: "Fiction G", copies: 2 },
  { title: "The Art of War", author: "Sun Tzu", isbn: "978-0-14-044598-2", genre: "Philosophy", publisher: "Penguin Classics", publishedYear: -500, pages: 112, description: "The ancient Chinese military treatise, still essential reading for strategists, leaders, and curious minds.", coverColor: "#8b1a1a", location: "Philosophy S", copies: 3 },
  { title: "Normal People", author: "Sally Rooney", isbn: "978-0-571-33489-7", genre: "Fiction", publisher: "Faber & Faber", publishedYear: 2018, pages: 273, description: "The emotionally complex relationship between two young people from Sligo who are irresistibly drawn together through school and university.", coverColor: "#c8a882", location: "Fiction R", copies: 2 },
  { title: "A Brief History of Time", author: "Stephen Hawking", isbn: "978-0-553-38016-3", genre: "Science", publisher: "Bantam Books", publishedYear: 1988, pages: 212, description: "A landmark volume in science writing by one of the great minds of our time, exploring the nature of space, time, and the universe.", coverColor: "#1a2a4a", location: "Science H", copies: 2 },
  { title: "The Iliad", author: "Homer", isbn: "978-0-14-044592-0", genre: "Fiction", publisher: "Penguin Classics", publishedYear: -750, pages: 704, description: "The monumental epic poem of the Trojan War, in Robert Fagles' acclaimed translation. A foundational work of Western literature.", coverColor: "#6b6b2d", location: "Fiction H", copies: 1 },
  { title: "Long Walk to Freedom", author: "Nelson Mandela", isbn: "978-0-316-54585-7", genre: "Biography", publisher: "Little, Brown", publishedYear: 1994, pages: 656, description: "Nelson Mandela's autobiography, from his childhood in rural Transkei to his inauguration as the first democratically elected President of South Africa.", coverColor: "#006633", location: "Biography M", copies: 2 },
  { title: "Poems 1972–2002", author: "Seamus Heaney", isbn: "978-0-374-52571-2", genre: "Poetry", publisher: "Farrar, Straus and Giroux", publishedYear: 2002, pages: 480, description: "A selection spanning thirty years of the Nobel laureate's work, from Death of a Naturalist to Electric Light.", coverColor: "#4a3728", location: "Poetry H", copies: 1 },
  { title: "The Name of the Rose", author: "Umberto Eco", isbn: "978-0-15-144647-6", genre: "Mystery", publisher: "Harcourt", publishedYear: 1980, pages: 502, description: "A murder mystery set in an Italian monastery in 1327, weaving together semiotics, biblical analysis, medieval studies, and literary theory.", coverColor: "#3d2b1a", location: "Mystery E", copies: 2 },
  { title: "Dune", author: "Frank Herbert", isbn: "978-0-441-17271-9", genre: "Science Fiction", publisher: "Ace Books", publishedYear: 1965, pages: 688, description: "The epic saga of politics, religion, and survival on the desert planet Arrakis — the sole source of the most valuable substance in the universe.", coverColor: "#c8a832", location: "Sci-Fi H", copies: 2 },
  { title: "The Very Hungry Caterpillar", author: "Eric Carle", isbn: "978-0-399-22690-1", genre: "Children", publisher: "Philomel", publishedYear: 1969, pages: 32, description: "A beloved classic following a caterpillar's journey through a week of eating before his magical transformation.", coverColor: "#e05c2d", location: "Children C", copies: 3 },
  { title: "Ways of Seeing", author: "John Berger", isbn: "978-0-14-021631-6", genre: "Art", publisher: "Penguin Books", publishedYear: 1972, pages: 166, description: "The landmark exploration of how we look at art, advertising, and the world, based on the BBC television series.", coverColor: "#1a1a1a", location: "Art B", copies: 1 },
  { title: "The Design of Everyday Things", author: "Don Norman", isbn: "978-0-465-06710-7", genre: "Technology", publisher: "Basic Books", publishedYear: 2013, pages: 368, description: "The foundational text on user-centred design and the psychology behind why some products satisfy and others frustrate.", coverColor: "#2d4a6e", location: "Technology N", copies: 2 },
  { title: "Crime and Punishment", author: "Fyodor Dostoevsky", isbn: "978-0-14-044913-3", genre: "Fiction", publisher: "Penguin Classics", publishedYear: 1866, pages: 671, description: "Raskolnikov, a destitute ex-student in St Petersburg, murders a pawnbroker for her money and is then consumed by guilt.", coverColor: "#4a2020", location: "Fiction D", copies: 2 },
  { title: "Thinking in Bets", author: "Annie Duke", isbn: "978-0-7352-1592-4", genre: "Non-Fiction", publisher: "Portfolio/Penguin", publishedYear: 2018, pages: 288, description: "A former professional poker player on making smarter decisions when you don't have all the facts.", coverColor: "#1a3a1a", location: "Non-Fiction D", copies: 1 },
  { title: "The Elegance of the Hedgehog", author: "Muriel Barbery", isbn: "978-1-933372-60-6", genre: "Fiction", publisher: "Europa Editions", publishedYear: 2006, pages: 325, description: "The story of Renée, a self-taught concierge in a Parisian apartment building, and Paloma, a precocious 12-year-old who plans to end her life.", coverColor: "#8b7355", location: "Fiction B", copies: 1 },
  { title: "Meditations", author: "Marcus Aurelius", isbn: "978-0-14-044140-3", genre: "Philosophy", publisher: "Penguin Classics", publishedYear: 180, pages: 254, description: "Personal writings by the Roman Emperor Marcus Aurelius recording his private notes to himself and ideas on Stoic philosophy.", coverColor: "#5c5c3d", location: "Philosophy A", copies: 2 },
  { title: "To Kill a Mockingbird", author: "Harper Lee", isbn: "978-0-06-112008-4", genre: "Fiction", publisher: "Harper Perennial", publishedYear: 1960, pages: 336, description: "Set in the American South during the 1930s, Atticus Finch defends a Black man falsely accused of raping a white woman.", coverColor: "#6b4a2d", location: "Fiction L", copies: 3 },
  { title: "The Gene: An Intimate History", author: "Siddhartha Mukherjee", isbn: "978-1-4767-3352-4", genre: "Science", publisher: "Scribner", publishedYear: 2016, pages: 608, description: "The extraordinary story of the gene — from Mendel's garden to the future of genomic medicine.", coverColor: "#2d5c3d", location: "Science M", copies: 1 },
  { title: "Educated", author: "Tara Westover", isbn: "978-0-399-59050-4", genre: "Biography", publisher: "Random House", publishedYear: 2018, pages: 334, description: "A memoir about a young woman who, raised in the mountains of Idaho by survivalist parents, never set foot in a classroom until she was 17.", coverColor: "#8b6b2d", location: "Biography W", copies: 2 },
  { title: "Norwegian Wood", author: "Haruki Murakami", isbn: "978-0-375-70402-8", genre: "Fiction", publisher: "Vintage", publishedYear: 1987, pages: 296, description: "A nostalgic, melancholic story of loss, sexuality, and coming of age in 1960s Tokyo.", coverColor: "#2d5c5c", location: "Fiction M", copies: 2 },
];

const MEMBERS = [
  { name: "Eleanor Ashton",  email: "e.ashton@ashbrook.lib",  phone: "07700 900001", address: "12 Mill Road, Ashbrook", status: "active" },
  { name: "James Thornbury", email: "j.thornbury@gmail.com",  phone: "07700 900002", address: "4 Church Lane, Ashbrook", status: "active" },
  { name: "Priya Nair",      email: "priya.nair@email.com",   phone: "07700 900003", address: "88 High Street, Ashbrook", status: "active" },
  { name: "William Osei",    email: "w.osei@workmail.com",    phone: "07700 900004", address: "21 Elm Close, Ashbrook", status: "active" },
  { name: "Isabelle Müller", email: "i.muller@email.de",      phone: "07700 900005", address: "6 Beech Grove, Ashbrook", status: "active" },
  { name: "Seun Adeyemi",    email: "s.adeyemi@gmail.com",    phone: "07700 900006", address: "33 Victoria Street, Ashbrook", status: "active" },
  { name: "Clara Whitfield", email: "c.whitfield@email.co.uk",phone: "07700 900007", address: "7 Riverside Walk, Ashbrook", status: "suspended", notes: "Outstanding fine from 2023." },
  { name: "Thomas Bergmann", email: "t.bergmann@email.com",   phone: "07700 900008", address: "55 Oak Avenue, Ashbrook", status: "active" },
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/library");
    console.log("Connected to MongoDB");

    // Clear existing data
    await Promise.all([Book.deleteMany({}), Member.deleteMany({}), Loan.deleteMany({})]);
    console.log("Cleared existing data");

    // Insert books
    const books = await Book.insertMany(
      BOOKS.map(b => ({ ...b, availableCopies: b.copies }))
    );
    console.log(`Inserted ${books.length} books`);

    // Insert members (one at a time to trigger pre-save hook for memberNumber)
    const members = [];
    for (const m of MEMBERS) {
      const member = await new Member(m).save();
      members.push(member);
    }
    console.log(`Inserted ${members.length} members`);

    // Create some sample loans
    const now = new Date();
    const daysAgo = n => { const d = new Date(now); d.setDate(d.getDate() - n); return d; };
    const daysFromNow = n => { const d = new Date(now); d.setDate(d.getDate() + n); return d; };

    const sampleLoans = [
      // Active — Eleanor has Sapiens (due in 5 days)
      {
        book: books.find(b => b.title === "Sapiens: A Brief History of Humankind")._id,
        member: members[0]._id,
        borrowedAt: daysAgo(9),
        dueAt: daysFromNow(5),
        status: "active",
      },
      // Active — James has Dune (due tomorrow)
      {
        book: books.find(b => b.title === "Dune")._id,
        member: members[1]._id,
        borrowedAt: daysAgo(13),
        dueAt: daysFromNow(1),
        status: "active",
      },
      // OVERDUE — Priya has The Name of the Rose (6 days overdue)
      {
        book: books.find(b => b.title === "The Name of the Rose")._id,
        member: members[2]._id,
        borrowedAt: daysAgo(20),
        dueAt: daysAgo(6),
        status: "overdue",
      },
      // OVERDUE — William has Thinking, Fast and Slow (3 days overdue)
      {
        book: books.find(b => b.title === "Thinking, Fast and Slow")._id,
        member: members[3]._id,
        borrowedAt: daysAgo(17),
        dueAt: daysAgo(3),
        status: "overdue",
      },
      // Active — Isabelle has Norwegian Wood (due in 8 days)
      {
        book: books.find(b => b.title === "Norwegian Wood")._id,
        member: members[4]._id,
        borrowedAt: daysAgo(6),
        dueAt: daysFromNow(8),
        status: "active",
      },
      // Returned — Eleanor returned Middlemarch
      {
        book: books.find(b => b.title === "Middlemarch")._id,
        member: members[0]._id,
        borrowedAt: daysAgo(30),
        dueAt: daysAgo(16),
        returnedAt: daysAgo(18),
        status: "returned",
      },
      // Returned — Thomas returned To Kill a Mockingbird
      {
        book: books.find(b => b.title === "To Kill a Mockingbird")._id,
        member: members[7]._id,
        borrowedAt: daysAgo(25),
        dueAt: daysAgo(11),
        returnedAt: daysAgo(13),
        status: "returned",
      },
      // Active — Seun has Educated
      {
        book: books.find(b => b.title === "Educated")._id,
        member: members[5]._id,
        borrowedAt: daysAgo(4),
        dueAt: daysFromNow(10),
        status: "active",
      },
    ];

    for (const loanData of sampleLoans) {
      const loan = await Loan.create(loanData);
      // Reduce available copies for active/overdue loans
      if (loan.status !== "returned") {
        await Book.findByIdAndUpdate(loanData.book, { $inc: { availableCopies: -1 } });
      }
    }
    console.log(`Created ${sampleLoans.length} sample loans`);

    console.log("\n✦ Seed complete! Visit http://localhost:3000");
    console.log("  Books: 25 | Members: 8 | Loans: 8 (4 active, 2 overdue, 2 returned)\n");
    process.exit(0);
  } catch (err) {
    console.error("Seed error:", err);
    process.exit(1);
  }
}

seed();
