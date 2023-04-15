import { useEffect } from 'react';

const GenerateCodePage = () => {
  useEffect(() => {
    async function fetchData() {
      try {
        const response = await fetch('/api/generate_code');
        const data = await response.json();
        console.log(data);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    }

    fetchData();
  }, []);

  return (
    <div>
      <h1>Generating Code...</h1>
    </div>
  );
};

export default GenerateCodePage;
