USE ghar_se_khana;

CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role ENUM('student', 'provider', 'admin') NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE providers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  kitchen_name VARCHAR(150) NOT NULL,
  location VARCHAR(150) NOT NULL,
  veg_only BOOLEAN DEFAULT true,
  rating DECIMAL(2,1) DEFAULT 0.0,
  is_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE
);

CREATE TABLE menus (
  id INT AUTO_INCREMENT PRIMARY KEY,
  provider_id INT NOT NULL,
  day ENUM(
    'Monday','Tuesday','Wednesday',
    'Thursday','Friday','Saturday','Sunday'
  ) NOT NULL,
  meal_type ENUM('breakfast', 'lunch', 'dinner') NOT NULL,
  items TEXT NOT NULL,
  price DECIMAL(8,2) NOT NULL,
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (provider_id) REFERENCES providers(id)
    ON DELETE CASCADE
);

CREATE TABLE orders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  student_id INT NOT NULL,
  provider_id INT NOT NULL,
  menu_id INT NOT NULL,
  order_date DATE NOT NULL,
  status ENUM('pending', 'accepted', 'rejected', 'delivered') DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (student_id) REFERENCES users(id)
    ON DELETE CASCADE,

  FOREIGN KEY (provider_id) REFERENCES providers(id)
    ON DELETE CASCADE,

  FOREIGN KEY (menu_id) REFERENCES menus(id)
    ON DELETE CASCADE
);

CREATE TABLE reviews (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_id INT NOT NULL,
  rating INT CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (order_id) REFERENCES orders(id)
    ON DELETE CASCADE
);


