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

// Definindo os filtros e página atual
$component_filter = isset($_GET['component']) ? $_GET['component'] : '';
$event_filter = isset($_GET['event']) ? $_GET['event'] : '';
$page = isset($_GET['page']) ? (int)$_GET['page'] : 1;
$limit = 100; // Número de resultados por página (últimos 100)
$offset = ($page - 1) * $limit;

// Construindo a consulta com filtros
$sql = "SELECT * FROM logs WHERE 1=1";

if ($component_filter) {
    $sql .= " AND component LIKE '" . $conn->real_escape_string($component_filter) . "'";
}

if ($event_filter) {
    $sql .= " AND event LIKE '" . $conn->real_escape_string($event_filter) . "'";
}

$sql .= " ORDER BY timestamp DESC LIMIT $limit OFFSET $offset";

// Executa a consulta
$result = $conn->query($sql);

// Contar o total de registros para a paginação
$count_sql = "SELECT COUNT(*) as total, MAX(timestamp) as last_log_time FROM logs WHERE 1=1";

if ($component_filter) {
    $count_sql .= " AND component LIKE '" . $conn->real_escape_string($component_filter) . "'";
}

if ($event_filter) {
    $count_sql .= " AND event LIKE '" . $conn->real_escape_string($event_filter) . "'";
}

$count_result = $conn->query($count_sql);
$total_row = $count_result->fetch_assoc();
$total_records = $total_row['total'];
$last_log_time = $total_row['last_log_time'];
$last_log_time_corrected = $last_log_time ? date('Y-m-d H:i:s', strtotime($last_log_time) - 3 * 3600) : 'N/A'; // Ajusta a hora em 3 horas

$total_pages = ceil($total_records / $limit);

// Estilo CSS para melhorar a aparência
echo '<style>
    body {
        font-family: Arial, sans-serif;
        margin: 0;
        padding: 20px;
        background-color: #f4f4f9;
    }
    h1 {
        font-size: 36px;
        color: #333;
    }
    h2 {
        font-size: 24px;
        color: #666;
    }
    table {
        width: 100%;
        border-collapse: collapse;
        margin-top: 20px;
    }
    table, th, td {
        border: 1px solid #ddd;
    }
    th, td {
        padding: 8px;
        text-align: left;
    }
    th {
        background-color: #f2f2f2;
    }
    td {
        background-color: #fff;
    }
    tr:nth-child(even) td {
        background-color: #f9f9f9;
    }
    select, input[type="submit"] {
        padding: 5px 10px;
        margin-right: 10px;
    }
    form {
        margin-bottom: 20px;
    }
    .pagination {
        margin-top: 20px;
    }
    .pagination a {
        padding: 8px 16px;
        margin: 0 5px;
        text-decoration: none;
        background-color: #007bff;
        color: #fff;
        border-radius: 4px;
    }
    .pagination a:hover {
        background-color: #0056b3;
    }
</style>';

// Título e subtítulo
echo "<h1>Utopias - Sonhos Coletivos</h1>";
echo "<h2>Monitoramento dos Componentes</h2>";

// Hora do último log
echo "<p><strong>Último log recebido:</strong> " . $last_log_time_corrected . "</p>";

// Filtros
echo '<form method="GET" id="filter-form">';
echo 'Component: <select name="component" onchange="document.getElementById(\'filter-form\').submit()">';
echo '<option value="">Todos</option>';
$components = ['internet', 'arduino', 'websocket', 'server'];
foreach ($components as $component) {
    $selected = ($component_filter == $component) ? 'selected' : '';
    echo '<option value="' . $component . '" ' . $selected . '>' . ucfirst($component) . '</option>';
}
echo '</select>';

echo 'Event: <select name="event" onchange="document.getElementById(\'filter-form\').submit()">';
echo '<option value="">Todos</option>';
$events = ['connected', 'disconnected', 'error'];
foreach ($events as $event) {
    $selected = ($event_filter == $event) ? 'selected' : '';
    echo '<option value="' . $event . '" ' . $selected . '>' . ucfirst($event) . '</option>';
}
echo '</select>';
echo '</form>';

// Tabela de logs
if ($result->num_rows > 0) {
    echo '<table>';
    echo '<tr><th>ID</th><th>Component</th><th>Event</th><th>Timestamp</th><th>Message</th></tr>';

    while ($row = $result->fetch_assoc()) {
        echo '<tr>';
        echo '<td>' . $row['id'] . '</td>';
        echo '<td>' . $row['component'] . '</td>';
        echo '<td>' . $row['event'] . '</td>';
        echo '<td>' . date('Y-m-d H:i:s', strtotime($row['timestamp']) - 3 * 3600) . '</td>';
        echo '<td>' . htmlspecialchars($row['message']) . '</td>';
        echo '</tr>';
    }
    echo '</table>';
} else {
    echo '<p>Não há logs para exibir.</p>';
}

// Paginação
echo '<div class="pagination">';
for ($i = 1; $i <= $total_pages; $i++) {
    echo '<a href="?page=' . $i . '&component=' . urlencode($component_filter) . '&event=' . urlencode($event_filter) . '">' . $i . '</a> ';
}
echo '</div>';

// Fechar conexão
$conn->close();
?>
