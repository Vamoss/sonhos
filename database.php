<?php
$host = '127.0.0.1';
$user = 'lorem';
$password = 'ipsum';
$database = 'sonhos';

// Conectar ao MySQL
$conn = new mysqli($host, $user, $password, $database);

if ($conn->connect_error) {
    die("Conexão falhou: " . $conn->connect_error);
}

// Receber dados via POST
$word1 = $_POST['word1'] ?? null;
$word2 = $_POST['word2'] ?? null;
$word3 = $_POST['word3'] ?? null;
$phrase = $_POST['phrase'] ?? null;

// Inserir dados
$conn->query("SET time_zone = '-03:00'");
$stmt = $conn->prepare("INSERT INTO results (word1, word2, word3, phrase, created) VALUES (?, ?, ?, ?, NOW())");
$stmt->bind_param('ssss', $word1, $word2, $word3, $phrase);
$stmt->execute();

echo "Dados inseridos com sucesso!";

$stmt->close();
$conn->close();
?>