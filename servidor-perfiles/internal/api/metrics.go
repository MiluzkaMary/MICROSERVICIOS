package api

import (
	"fmt"
	"net/http"
	"sort"
	"strings"
	"sync"
	"time"
)

type requestKey struct {
	Method string
	Route  string
	Status string
}

type metricsStore struct {
	mu            sync.Mutex
	requests      map[requestKey]uint64
	durationSum   map[requestKey]float64
	durationCount map[requestKey]uint64
}

var serviceMetrics = &metricsStore{
	requests:      make(map[requestKey]uint64),
	durationSum:   make(map[requestKey]float64),
	durationCount: make(map[requestKey]uint64),
}

func MetricsMiddleware() func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			start := time.Now()
			rw := &statusRecorder{ResponseWriter: w, statusCode: http.StatusOK}
			next.ServeHTTP(rw, r)

			key := requestKey{
				Method: r.Method,
				Route:  routeLabel(r.URL.Path),
				Status: fmt.Sprintf("%d", rw.statusCode),
			}

			serviceMetrics.mu.Lock()
			serviceMetrics.requests[key]++
			serviceMetrics.durationSum[key] += time.Since(start).Seconds()
			serviceMetrics.durationCount[key]++
			serviceMetrics.mu.Unlock()
		})
	}
}

func MetricsHandler(w http.ResponseWriter, _ *http.Request) {
	serviceMetrics.mu.Lock()
	defer serviceMetrics.mu.Unlock()

	w.Header().Set("Content-Type", "text/plain; version=0.0.4; charset=utf-8")

	_, _ = fmt.Fprintln(w, "# HELP http_requests_total Total de peticiones HTTP")
	_, _ = fmt.Fprintln(w, "# TYPE http_requests_total counter")

	keys := make([]requestKey, 0, len(serviceMetrics.requests))
	for key := range serviceMetrics.requests {
		keys = append(keys, key)
	}
	sort.Slice(keys, func(i, j int) bool {
		if keys[i].Route != keys[j].Route {
			return keys[i].Route < keys[j].Route
		}
		if keys[i].Method != keys[j].Method {
			return keys[i].Method < keys[j].Method
		}
		return keys[i].Status < keys[j].Status
	})

	for _, key := range keys {
		count := serviceMetrics.requests[key]
		_, _ = fmt.Fprintf(
			w,
			"http_requests_total{service=\"perfiles-service\",method=\"%s\",route=\"%s\",status=\"%s\"} %d\n",
			key.Method,
			key.Route,
			key.Status,
			count,
		)
	}

	_, _ = fmt.Fprintln(w, "# HELP http_request_duration_seconds_sum Suma de duraciones de peticiones HTTP en segundos")
	_, _ = fmt.Fprintln(w, "# TYPE http_request_duration_seconds_sum counter")
	for _, key := range keys {
		sum := serviceMetrics.durationSum[key]
		_, _ = fmt.Fprintf(
			w,
			"http_request_duration_seconds_sum{service=\"perfiles-service\",method=\"%s\",route=\"%s\",status=\"%s\"} %f\n",
			key.Method,
			key.Route,
			key.Status,
			sum,
		)
	}

	_, _ = fmt.Fprintln(w, "# HELP http_request_duration_seconds_count Total de mediciones de latencia")
	_, _ = fmt.Fprintln(w, "# TYPE http_request_duration_seconds_count counter")
	for _, key := range keys {
		count := serviceMetrics.durationCount[key]
		_, _ = fmt.Fprintf(
			w,
			"http_request_duration_seconds_count{service=\"perfiles-service\",method=\"%s\",route=\"%s\",status=\"%s\"} %d\n",
			key.Method,
			key.Route,
			key.Status,
			count,
		)
	}
}

func routeLabel(path string) string {
	if strings.TrimSpace(path) == "" {
		return "/"
	}
	return path
}

type statusRecorder struct {
	http.ResponseWriter
	statusCode int
}

func (rw *statusRecorder) WriteHeader(code int) {
	rw.statusCode = code
	rw.ResponseWriter.WriteHeader(code)
}
