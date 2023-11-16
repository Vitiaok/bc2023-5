// Підключення необхідних модулів і бібліотек
const express = require('express');  // Підключення бібліотеки Express
const multer = require('multer');     // Підключення бібліотеки Multer для завантаження файлів
const fs = require('fs');             // Підключення бібліотеки fs для роботи з файловою системою
const path = require('path');         // Підключення бібліотеки path для роботи зі шляхами файлів

// Створення і налаштування екземпляра сервера Express
const app = express();                // Створення сервера Express
const port = 8000;                    // Визначення номеру порту, на якому запускатиметься сервер

app.use(express.json());               // Використання JSON-парсера для обробки запитів з JSON-даними

// Визначення шляху до файлу, де зберігаються нотатки
const notesFile = path.join(__dirname, 'notes.json');

// Роут для отримання списку нотаток
app.get('/notes', (req, res) => {
  try {
    const data = fs.readFileSync(notesFile, 'utf8');  // Читання даних з файлу
    const notes = JSON.parse(data);                  // Розшифровка JSON-даних
    res.json(notes);                                  // Надсилання списку нотаток як відповіді
  } catch (err) {
    res.json([]);                                    // Якщо сталася помилка, повертаємо пустий список
  }
});

// Роут для відправки статичної HTML-сторінки для завантаження нотаток
app.get('/UploadForm.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'static', 'UploadForm.html'));  // Відправка статичного HTML-файлу
});

// Налаштування місця зберігання завантажених файлів і їх імен
const storage = multer.diskStorage({
  destination: './',                            // Місце зберігання файлів
  filename: function (req, file, cb) {            // Функція для визначення імені файлу
    cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });      // Налаштування завантаження файлів

// Роут для завантаження нової нотатки
app.post('/upload', upload.single('note_name'), (req, res) => {
  const note_name = req.body.note_name;            // Отримання назви нотатки з запиту
  const note = req.body.note;                      // Отримання тексту нотатки з запиту

  try {
    const data = fs.readFileSync(notesFile, 'utf8');  // Читання даних з файлу
    const notes = JSON.parse(data);                  // Розшифровка JSON-даних

    const existingNote = notes.find((note) => note.name === note_name);  // Пошук наявної нотатки

    if (existingNote) {
      res.status(400).send('Note with the same name already exists.');  // Якщо нотатка вже існує, повертаємо помилку
    } else {
      notes.push({ name: note_name, text: note });  // Додавання нової нотатки до списку
      fs.writeFileSync(notesFile, JSON.stringify(notes, null, 2));  // Збереження оновленого списку в файлі
      res.status(201).send('Note uploaded successfully.');  // Повідомлення про успішне завантаження нотатки
    }
  } catch (err) {
    const notes = [{ name: note_name, text: note }];  // Створення нового списку, якщо файл не існує
    fs.writeFileSync(notesFile, JSON.stringify(notes, null, 2));  // Збереження списку в файлі
    res.status(201).send('Note uploaded successfully.');  // Повідомлення про успішне завантаження нотатки
  }
});

// Роут для отримання інформації про конкретну нотатку за ім'ям
app.get('/notes/:note_name', (req, res) => {
  const note_name = req.params.note_name;          // Отримання імені нотатки з URL

  try {
    const data = fs.readFileSync(notesFile, 'utf8');  // Читання даних з файлу
    const notes = JSON.parse(data);                  // Розшифровка JSON-даних

    const note = notes.find((note) => note.name === note_name);  // Пошук нотатки за іменем

    if (note) {
      res.json(note);                                // Надсилання інформації про нотатку як відповіді
    } else {
      res.status(404).send('Note not found.');       // Якщо нотатка не знайдено, повертаємо помилку 404
    }
  } catch (err) {
    res.status(404).send('Note not found.');         // Обробка помилки, якщо не вдається прочитати файл
  }
});

// Роут для оновлення тексту нотатки за ім'ям
app.put('/notes/:note_name', (req, res) => {
  const note_name = req.params.note_name;            // Отримання імені нотатки з URL
  const new_text = req.params.new_text;              // Отримання нового тексту нотатки з URL

  try {
    const data = fs.readFileSync(notesFile, 'utf8');  // Читання даних з файлу
    const notes = JSON.parse(data);                  // Розшифровка JSON-даних

    const noteIndex = notes.findIndex((note) => note.name === note_name);  // Пошук індексу нотатки за іменем

    if (noteIndex !== -1) {
      notes[noteIndex].text = new_text;  // Оновлення тексту нотатки
      fs.writeFileSync(notesFile, JSON.stringify(notes, null, 2));  // Збереження оновленого списку в файлі
      res.send('Note updated successfully.');  // Повідомлення про успішне оновлення нотатки
    } else {
      res.status(404).send('Note not found.');  // Якщо нотатка не знайдена, повертаємо помилку 404
    }
  } catch (err) {
    res.status(404).send('Note not found.');  // Обробка помилки, якщо не вдається прочитати файл
  }
});

// Роут для видалення нотатки за ім'ям
app.delete('/notes/:note_name', (req, res) => {
  const note_name = req.params.note_name;          // Отримання імені нотатки з URL

  try {
    const data = fs.readFileSync(notesFile, 'utf8');  // Читання даних з файлу
    const notes = JSON.parse(data);                  // Розшифровка JSON-даних

    const noteIndex = notes.findIndex((note) => note.name === note_name);  // Пошук індексу нотатки за іменем

    if (noteIndex !== -1) {
      notes.splice(noteIndex, 1);  // Видалення нотатки зі списку
      fs.writeFileSync(notesFile, JSON.stringify(notes, null, 2));  // Збереження оновленого списку в файлі
      res.send('Note deleted successfully.');  // Повідомлення про успішне видалення нотатки
    } else {
      res.status(404).send('Note not found.');  // Якщо нотатка не знайдена, повертаємо помилку 404
    }
  } catch (err) {
    res.status(404).send('Note not found.');  // Обробка помилки, якщо не вдається прочитати файл
  }
});

// Запуск сервера на заданому порту
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);  // Повідомлення про запуск сервера
});