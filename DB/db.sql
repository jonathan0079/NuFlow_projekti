CREATE DATABASE NuFlow;
USE NuFlow;

CREATE TABLE users (
    user_id INT PRIMARY KEY AUTO_INCREMENT,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NULL,
    last_name VARCHAR(100) NULL,
    birthday DATE NULL,
    height DECIMAL(5,2),
    weight DECIMAL(5,2),
    gender ENUM('male', 'female', 'other') NULL,
    user_level ENUM('user', 'professional', 'moderator') NOT NULL DEFAULT 'user'
);

CREATE TABLE health_metrics (
    metric_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    drug_use TEXT,
    diseases_medications TEXT,
    sleep TEXT,
    self_assessment TEXT,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

CREATE TABLE diary_entries (
    entry_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    entry_date DATE NOT NULL,
    time_of_day ENUM('morning', 'evening') NOT NULL,
    sleep_duration DECIMAL(4,2),
    sleep_notes TEXT,
    current_mood INT CHECK (current_mood BETWEEN 1 AND 5),
    activity TEXT,
    professional_comment TEXT,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

CREATE TABLE hrv_data (
    hrv_id INT PRIMARY KEY AUTO_INCREMENT,
    entry_id INT NOT NULL,
    hrv_date DATE NOT NULL,
    heart_rate INT NOT NULL,
    rmssd DECIMAL(10,2) NOT NULL,
    mean_rr DECIMAL(10,2) NOT NULL,
    sdnn DECIMAL(10,2) NOT NULL,
    pns_index DECIMAL(10,2) NOT NULL,
    sns_index DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (entry_id) REFERENCES diary_entries(entry_id) ON DELETE CASCADE
);

INSERT INTO users (email, password, first_name, last_name, birthday, height, weight, gender, user_level) VALUES
('patient@example.com', 'hashedpassword1', 'Potilas', 'Pekka', '1990-05-15', 180.5, 75.0, 'male', 'user'),
('doctor@example.com', 'hashedpassword2', 'Ammattilainen', 'Antti', '1985-10-22', 165.0, 65.0, 'female', 'professional'),
('user3@example.com', 'hashedpassword3', 'Joonas', 'Johnson', '1995-07-12', 172.0, 68.0, 'female', 'moderator');

INSERT INTO health_metrics (user_id, drug_use, diseases_medications, sleep, self_assessment) VALUES
(1, 'None', 'Hypertension', '7 hours', 'Feeling good'),
(2, 'Occasional alcohol', 'None', '6 hours', 'Feeling tired'),
(3, 'None', 'Asthma', '8 hours', 'Feeling excellent');

INSERT INTO diary_entries (user_id, entry_date, time_of_day, sleep_duration, sleep_notes, current_mood, activity) VALUES
(1, '2024-03-24', 'morning', 7.5, 'Slept well', 4, 'Jogging'),
(2, '2024-03-24', 'evening', 6.0, 'Woke up twice', 3, 'Yoga'),
(3, '2024-03-24', 'morning', 8.0, 'Felt refreshed', 5, 'Meditation');

INSERT INTO hrv_data (entry_id, hrv_date, heart_rate, rmssd, mean_rr, sdnn, pns_index, sns_index) VALUES
(1, '2024-03-24', 60, 45.3, 980.2, 35.7, 2.1, 1.5),
(2, '2024-03-24', 70, 40.1, 900.5, 30.2, 1.8, 2.2),
(3, '2024-03-24', 65, 50.2, 1020.0, 40.1, 2.5, 1.2);