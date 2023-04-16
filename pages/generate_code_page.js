import { useEffect } from 'react';
import { useRouter } from 'next/router';

const GenerateCodePage = () => {
  const router = useRouter();
  const { recordId } = router.query;

  useEffect(() => {
    async function fetchData() {
      try {
        if (!recordId) {
          console.error('Error: Record ID is missing from the URL.');
          return;
        }

        const response = await fetch(`/api/generate_code?recordId=${recordId}`);
        const data = await response.json();
        console.log(data);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    }

    if (recordId) {
      fetchData();
    }
  }, [recordId]);

  return (
    <div>
      <h1>Generating Code...</h1>
    </div>
  );
};

export default GenerateCodePage;
