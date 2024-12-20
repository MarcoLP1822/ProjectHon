import { useState } from 'react';

function Dashboard() {
  const [apiKey, setApiKey] = useState('');

  const handleSaveApiKey = async () => {
    try {
      const response = await fetch('/api/save-api-key', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ apiKey }),
      });

      if (response.ok) {
        alert('Chiave API salvata con successo!');
        setApiKey(''); // Pulisce il campo dopo il salvataggio
      } else {
        alert('Errore nel salvare la chiave API');
      }
    } catch (error) {
      console.error('Errore:', error);
      alert('Errore nel salvare la chiave API');
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-bold mb-4">Gestione API OpenAI</h2>
      <div className="mt-4">
        <h3 className="text-lg font-semibold mb-2">Configurazione OpenAI</h3>
        <div className="flex gap-2">
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="Inserisci la chiave API di OpenAI"
            className="flex-1 p-2 border rounded"
          />
          <button
            onClick={handleSaveApiKey}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Salva
          </button>
        </div>
      </div>
    </div>
  );
}

export default Dashboard; 