import { useCallback, useEffect, useRef, useState } from 'react';

export default function useAsyncData(loader, dependencies = []) {
  const loaderRef = useRef(loader);
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const dependencyKey = JSON.stringify(dependencies);

  loaderRef.current = loader;

  const load = useCallback(async () => {
    setIsLoading(true);
    setError('');

    try {
      const response = await loaderRef.current();
      setData(response.data.data);
    } catch (requestError) {
      const status = requestError.response?.status;
      setError(
        status
          ? `The request failed with status ${status}.`
          : 'Unable to reach the server. Please try again.',
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [dependencyKey, load]);

  return { data, error, isLoading, reload: load, setData };
}
