package com.empresa.notificaciones.repository;

import com.empresa.notificaciones.model.Notificacion;
import com.empresa.notificaciones.model.Notificacion.EstadoNotificacion;
import com.empresa.notificaciones.model.Notificacion.TipoNotificacion;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;

import java.util.ArrayList;
import java.util.List;

public class NotificacionSpecification {

    private NotificacionSpecification() {}

    public static Specification<Notificacion> withFilters(
            String q, String tipo, String estado, String empleadoId, String destinatario) {

        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (q != null && !q.isBlank()) {
                String like = "%" + q.toLowerCase() + "%";
                predicates.add(cb.or(
                        cb.like(cb.lower(root.get("destinatario")), like),
                        cb.like(cb.lower(root.get("mensaje")), like),
                        cb.like(cb.lower(root.get("empleadoId")), like)
                ));
            }

            if (tipo != null && !tipo.isBlank()) {
                try {
                    predicates.add(cb.equal(root.get("tipo"),
                            TipoNotificacion.valueOf(tipo.trim().toUpperCase())));
                } catch (IllegalArgumentException ignored) { /* valor inválido, ignorar */ }
            }

            if (estado != null && !estado.isBlank()) {
                try {
                    predicates.add(cb.equal(root.get("estado"),
                            EstadoNotificacion.valueOf(estado.trim().toUpperCase())));
                } catch (IllegalArgumentException ignored) { /* valor inválido, ignorar */ }
            }

            if (empleadoId != null && !empleadoId.isBlank()) {
                predicates.add(cb.equal(root.get("empleadoId"), empleadoId.trim()));
            }

            if (destinatario != null && !destinatario.isBlank()) {
                predicates.add(cb.like(cb.lower(root.get("destinatario")),
                        "%" + destinatario.toLowerCase() + "%"));
            }

            return cb.and(predicates.toArray(Predicate[]::new));
        };
    }
}
