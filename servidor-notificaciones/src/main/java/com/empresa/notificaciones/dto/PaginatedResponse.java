package com.empresa.notificaciones.dto;

import java.util.List;

import com.fasterxml.jackson.annotation.JsonInclude;

/**
 * DTO para respuestas paginadas
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public class PaginatedResponse<T> {

    private int page;
    private int size;
    private long totalRecords;
    private int totalPages;
    private List<T> items;

    public PaginatedResponse() {
    }

    public PaginatedResponse(int page, int size, long totalRecords, int totalPages, List<T> items) {
        this.page = page;
        this.size = size;
        this.totalRecords = totalRecords;
        this.totalPages = totalPages;
        this.items = items;
    }

    public int getPage() {
        return page;
    }

    public void setPage(int page) {
        this.page = page;
    }

    public int getSize() {
        return size;
    }

    public void setSize(int size) {
        this.size = size;
    }

    public long getTotalRecords() {
        return totalRecords;
    }

    public void setTotalRecords(long totalRecords) {
        this.totalRecords = totalRecords;
    }

    public int getTotalPages() {
        return totalPages;
    }

    public void setTotalPages(int totalPages) {
        this.totalPages = totalPages;
    }

    public List<T> getItems() {
        return items;
    }

    public void setItems(List<T> items) {
        this.items = items;
    }
}
