
const express = require('express');  
const fs = require('fs');  
const multer = require('multer'); 
const path = require('path');
const bodyParser = require("body-parser");

const app = express();  

const port = 8000;  


app.use(express.json());  
app.use(bodyParser.raw({ type: 'text/plain' }));

// Обробка GET-запиту для кореневого шляху
app.get('/', (req, res) => {
  res.send('Server is running');  
});

const notesFile = path.join(__dirname, 'notes.json');

// Обробка GET-запиту для сторінки UploadForm.html
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

// Створення екземпляра multer для обробки файлових завантажень
const upload = multer({ storage: storage });      // Налаштування завантаження файлів

// Обробка GET-запиту для отримання списку нотаток
app.get('/notes', (req, res) => {
  try {
    // Перевірка наявності файлу перед його зчитуванням
    if (!fs.existsSync(notesFile)) {
      fs.writeFileSync(notesFile, '[]', 'utf8');  // Створення файлу з порожнім масивом, якщо він не існує
    }

    const notes = JSON.parse(fs.readFileSync(notesFile, 'utf8'));  // Зчитування та парсинг файлу нотаток
    res.json(notes);  // Відправлення відповіді у форматі JSON зі списком нотаток
  } catch (error) {
    console.error('Помилка отримання списку нотаток:', error);  // Логування помилки у консоль
    res.status(500).json([]);  // Відправлення статусу помилки та порожнього списку нотаток
  }
});

// Обробка GET-запиту для отримання конкретної нотатки за ім'ям
app.get('/notes/:note_name', (req, res) => {
  const note_name = req.params.note_name;  // Отримання параметра note_name з URL
// Перевірка наявності файлу перед його зчитуванням
if (!fs.existsSync(notesFile)) {
  fs.writeFileSync(notesFile, '[]', 'utf8');  // Створення файлу з порожнім масивом, якщо він не існує
}
  if (note_name.trim() === '') {
    alert('Введіть назву нотатки.');  // Попередження, якщо ім'я нотатки порожнє
  }

  try {
    const data = fs.readFileSync(notesFile, 'utf8');  // Читання даних з файлу
    const notes = JSON.parse(data);  // Розшифровка JSON-даних

    const note = notes.find((note) => note.name === note_name);  // Пошук нотатки за іменем

    if (note) {
      res.send(note.text);  // Вивід тільки тексту нотатки
    } else {
      res.status(404).send('Нотатку не знайдено.');  // Відповідь з кодом статусу 404, якщо нотатка не знайдена
    }
  } catch (err) {
    res.status(404).send('Не можливо прочитати файл.');  // Обробка помилки, якщо не вдається прочитати файл
  }
});

// Обробка POST-запиту для завантаження нової нотатки
app.post('/upload', upload.none(), (req, res) => {
  // Перевірка наявності файлу перед його зчитуванням
  if (!fs.existsSync(notesFile)) {
    fs.writeFileSync(notesFile, '[]', 'utf8');  // Створення файлу з порожнім масивом, якщо він не існує
  }
  const note_name = req.body.note_name;  // Отримання параметра note_name з тіла запиту
  const note = req.body.note;  // Отримання параметра note з тіла запиту

  try {
    // Перевірка наявності файлу перед його зчитуванням
    if (!fs.existsSync(notesFile)) {
      fs.writeFileSync(notesFile, '[]', 'utf8');  // Створення файлу з порожнім масивом, якщо він не існує
    }

    const data = fs.readFileSync(notesFile, 'utf8');  // Читання даних з файлу
    const notes = JSON.parse(data);                  // Розшифровка JSON-даних

    const existingNote = notes.find((note) => note.name === note_name);  // Пошук наявної нотатки

    if (existingNote) {
      res.status(400).send('Нотатка з тим самим ім\'ям вже існує.');  // Якщо нотатка вже існує, повертаємо помилку
    } else {
      const newNote = { name: note_name, text: note };  // Створення нової нотатки
      notes.push(newNote);  // Додавання нової нотатки до списку
      fs.writeFileSync(notesFile, JSON.stringify(notes, null, 2));  // Збереження оновленого списку в файлі
      res.status(201).send('Нотатку створено');  // Повертаємо новостворену нотатку у тілі відповіді
    }
  } catch (err) {
    // Обробка помилок, якщо вони виникають при читанні файлу або парсингу JSON
    console.error(err);
    res.status(500).send('Internal Server Error');
  }
});

app.put("/notes/:note_name", (req, res) => {
  const note_name = req.params.note_name;

  try {
    // Check if the notes file exists before reading it
    if (!fs.existsSync(notesFile)) {
      fs.writeFileSync(notesFile, '[]', 'utf8');  // Create a file with an empty array if it doesn't exist
    }

    const data = fs.readFileSync(notesFile, 'utf8');  // Read data from the file
    const notes = JSON.parse(data);  // Parse JSON data

    const noteIndex = notes.findIndex(note => note.name === note_name);

    if (noteIndex !== -1) {
      notes[noteIndex].text = req.body.toString();
      fs.writeFileSync(notesFile, JSON.stringify(notes, null, 2));  // Save the updated list to the file
      console.log('Current state of notes:', notes);
      res.sendStatus(200);
    } else {
      res.sendStatus(404);  // Note not found
    }
  } catch (err) {
    console.error(err);
    res.status(500).send('Internal Server Error');
  }
});
/*
app.put("/notes/:note_name", (req, res) => {
  const note_name = req.params.note_name;
  const noteIndex = notesFile.findIndex(note => note.note_name === note_name);

  if (noteIndex !== -1) {
    notesFile[noteIndex].note = req.body.toString();
    console.log('Поточний стан notes:', req.body.toString());
    res.sendStatus(200);
  } else {
    res.sendStatus(404);
  }
});
/*
// Обробка PUT-запиту для оновлення тексту нотатки
app.put('/notes/:note_name', express.text(), (req, res) => {
  // Перевірка наявності файлу перед його зчитуванням
  if (!fs.existsSync(notesFile)) {
    fs.writeFileSync(notesFile, '[]', 'utf8');  // Створення файлу з порожнім масивом, якщо він не існує
  }
  const note_name = req.params.note_name;  // Отримання параметра note_name з URL
  const new_text = req.body;  // Отримання нового тексту нотатки з тіла запиту

  if (note_name.trim() === '') {
    return res.status(400).send('Введіть назву нотатки.');  // Відправлення статусу 400, якщо ім'я нотатки порожнє
  }

  const data = fs.readFileSync(notesFile, 'utf8');  // Читання даних з файлу
  const notes = JSON.parse(data);  // Розшифровка JSON-даних
  const note_UpdateI = notes.find((note) => note.name === note_name);  // Пошук нотатки за ім'ям

  if (note_UpdateI) {
    note_UpdateI.text = new_text;  // Оновлення тексту нотатки
    fs.writeFileSync(notesFile, JSON.stringify(notes), 'utf8');  // Запис оновленого масиву нотаток у файл
    res.status(200).send('Текст вказаної нотатки успішно оновлено');  // Відправлення статусу успіху
  } else {
    res.status(404).send('Не знайдено нотатку');  // Відправлення статусу 404, якщо нотатка не знайдена
  }
});
*/


// Обробка DELETE-запиту для видалення нотатки за ім'ям
app.delete('/notes/:note_name', (req, res) => {
  // Перевірка наявності файлу перед його зчитуванням
  if (!fs.existsSync(notesFile)) {
    fs.writeFileSync(notesFile, '[]', 'utf8');  // Створення файлу з порожнім масивом, якщо він не існує
  }
  const note_name = req.params.note_name;  // Отримання параметра note_name з URL
  try {
    const data = fs.readFileSync(notesFile, 'utf8');  // Читання даних з файлу
    const notes = JSON.parse(data);                  // Розшифровка JSON-даних

    const noteIndex = notes.findIndex((note) => note.name === note_name);  // Пошук індексу нотатки за іменем

    if (noteIndex !== -1) {
      notes.splice(noteIndex, 1);  // Видалення нотатки зі списку
      fs.writeFileSync(notesFile, JSON.stringify(notes, null, 2));  // Збереження оновленого списку в файлі
      res.send('Нотатку успішно видалено.');  // Повідомлення про успішне видалення нотатки
    } else {
      res.status(404).send('Нотатку не знайдено.');  // Якщо нотатка не знайдена, повертаємо помилку 404
    }
  } catch (err) {
    res.status(404).send('Не вдалося прочитати файл.');  // Обробка помилки, якщо не вдається прочитати файл
  }
});

// Запуск сервера на вказаному порту
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);  // Виведення повідомлення про запуск сервера у консоль
});