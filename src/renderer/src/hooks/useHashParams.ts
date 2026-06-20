import { useCallback, useMemo } from 'react';

function getHashParams(): URLSearchParams {
  const hash = window.location.hash;
  const queryIndex = hash.indexOf('?');
  if (queryIndex === -1) return new URLSearchParams();
  return new URLSearchParams(hash.slice(queryIndex + 1));
}

function setHashParams(params: URLSearchParams, replace = false): void {
  const hash = window.location.hash;
  const pathPart = hash.includes('?') ? hash.slice(0, hash.indexOf('?')) : hash;
  const newHash = `${pathPart}?${params.toString()}`;
  if (replace) {
    window.history.replaceState(null, '', newHash);
  } else {
    window.history.pushState(null, '', newHash);
  }
}

export function useHashParams(): [URLSearchParams, (params: URLSearchParams, replace?: boolean) => void] {
  const searchParams = useMemo(() => getHashParams(), [window.location.hash]);

  const setSearchParams = useCallback((params: URLSearchParams, replace = false) => {
    setHashParams(params, replace);
  }, []);

  return [searchParams, setSearchParams];
}