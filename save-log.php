<?php
$host = '127.0.0.1';
$user = 'lorem';
$password = 'ipsum';
$database = 'sonhos';

// Conectar ao MySQL
$conn = new mysqli($host, $user, $password, $database);

// Verifica se a conexão foi bem-sucedida
if ($conn->connect_error) {
    echo json_encode([
        'status' => false,
        'message' => 'Conexão falhou: ' . $conn->connect_error
    ]);
    exit;
}

// Receber dados via POST
$logData = $_POST['log'] ?? null;

// Verifica se os dados do log foram recebidos
if ($logData) {
    // Divida os dados de log em linhas
    $lines = explode("\n", $logData);
    $allLogsInserted = true;
    $errorMessage = '';

    foreach ($lines as $line) {
        // Remove espaços extras e quebras de linha
        $line = trim($line);

        if (!empty($line)) {
            // Decodifica o JSON para um array PHP
            $logArray = json_decode($line, true);

            if (json_last_error() === JSON_ERROR_NONE) {

                // Verifica se o JSON foi decodificado corretamente
                if ($logArray && isset($logArray['component'], $logArray['event'], $logArray['timestamp'])) {
                    // Inserir dados no banco de dados
                    $component = $logArray['component'];
                    $event = $logArray['event'];
                    $message = $logArray['message'];
                    $timestamp = $logArray['timestamp'];
                    $dateTime = new DateTime($timestamp);
                    $timestampMySQL = $dateTime->format('Y-m-d H:i:s');

                    $conn->query("SET time_zone = '-03:00'");
                    $stmt = $conn->prepare("INSERT INTO logs (component, event, timestamp, message) VALUES (?, ?, ?, ?)");
                    $stmt->bind_param('ssss', $component, $event, $timestampMySQL, $message);

                    // Verifica se a inserção foi bem-sucedida
                    if (!$stmt->execute()) {
                        $allLogsInserted = false;
                        $error_message = $stmt->error;
                        $error_code = $stmt->errno;
                        echo json_encode([
                            'status' => false,
                            'message' => 'Erro ao inserir log no banco de dados. Codigo de erro: ' . $error_code . ' Mensagem: ' . $error_message
                        ]);
                        exit; 
                    }

                    $stmt->close();
                } else {
                    $allLogsInserted = false;
                    $errorMessage = 'Formato de log inválido na linha: ' . $line;
                    break; // Sai do loop se o formato do JSON for inválido
                }
            } else {
                // Se o JSON estiver malformado
                echo json_encode([
                    'status' => false,
                    'message' => 'Erro ao processar o JSON: ' . json_last_error_msg()
                ]);
                break; 
            }
        }
    }

    // Resposta final com base no sucesso ou falha
    if ($allLogsInserted) {
        echo json_encode([
            'status' => true,
            'message' => 'Logs inseridos com sucesso!'
        ]);
    } else {
        echo json_encode([
            'status' => false,
            'message' => $errorMessage
        ]);
    }
} else {
    echo json_encode([
        'status' => false,
        'message' => 'Nenhum log foi enviado.'
    ]);
}

// Fechar a conexão
$conn->close();
?>
