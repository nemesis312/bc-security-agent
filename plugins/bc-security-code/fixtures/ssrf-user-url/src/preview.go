package preview

import (
	"io"
	"net/http"
)

// GET /preview?url=... returns the first bytes of any page as plain text so the UI can show a link preview.
func Preview(w http.ResponseWriter, r *http.Request) {
	target := r.URL.Query().Get("url")
	resp, err := http.Get(target)
	if err != nil {
		http.Error(w, "fetch failed", http.StatusBadGateway)
		return
	}
	defer resp.Body.Close()
	w.Header().Set("Content-Type", "text/plain; charset=utf-8")
	w.Header().Set("X-Content-Type-Options", "nosniff")
	io.Copy(w, io.LimitReader(resp.Body, 64*1024))
}
