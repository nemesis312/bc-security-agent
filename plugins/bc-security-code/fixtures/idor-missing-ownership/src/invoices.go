package invoices

import (
	"database/sql"
	"encoding/json"
	"net/http"
)

type Handler struct{ DB *sql.DB }

// GET /invoices/{id} — the route is behind the session middleware.
func (h *Handler) GetInvoice(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	var inv struct {
		ID      string  `json:"id"`
		OwnerID string  `json:"owner_id"`
		Amount  float64 `json:"amount"`
	}
	err := h.DB.QueryRowContext(r.Context(),
		"SELECT id, owner_id, amount FROM invoices WHERE id = $1", id).
		Scan(&inv.ID, &inv.OwnerID, &inv.Amount)
	if err != nil {
		http.NotFound(w, r)
		return
	}
	json.NewEncoder(w).Encode(inv)
}
