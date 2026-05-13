package com.empresa.notificaciones.dto;

import java.time.LocalDateTime;
import java.util.List;

import com.fasterxml.jackson.annotation.JsonInclude;

/**
 * DTO de respuesta estandar para la API.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ApiResponse<T> {

    private boolean success;
    private int statusCode;
    private String message;
    private T data;
    private Long total;
    private List<String> errors;
    private String timestamp;

    public ApiResponse() {
    }

    public ApiResponse(boolean success, int statusCode, String message, T data, Long total, List<String> errors, String timestamp) {
        this.success = success;
        this.statusCode = statusCode;
        this.message = message;
        this.data = data;
        this.total = total;
        this.errors = errors;
        this.timestamp = timestamp;
    }

    public static <T> ApiResponse<T> success(T data, int statusCode) {
        ApiResponse<T> response = new ApiResponse<>();
        response.setSuccess(true);
        response.setStatusCode(statusCode);
        response.setData(data);
        response.setTimestamp(LocalDateTime.now().toString());
        return response;
    }

    public static <T> ApiResponse<T> success(T data, int statusCode, long total) {
        ApiResponse<T> response = new ApiResponse<>();
        response.setSuccess(true);
        response.setStatusCode(statusCode);
        response.setData(data);
        response.setTotal(total);
        response.setTimestamp(LocalDateTime.now().toString());
        return response;
    }

    public static <T> ApiResponse<T> success(T data, int statusCode, String message) {
        ApiResponse<T> response = new ApiResponse<>();
        response.setSuccess(true);
        response.setStatusCode(statusCode);
        response.setData(data);
        response.setMessage(message);
        response.setTimestamp(LocalDateTime.now().toString());
        return response;
    }

    public static <T> ApiResponse<T> error(int statusCode, String message, List<String> errors) {
        ApiResponse<T> response = new ApiResponse<>();
        response.setSuccess(false);
        response.setStatusCode(statusCode);
        response.setMessage(message);
        response.setErrors(errors);
        response.setTimestamp(LocalDateTime.now().toString());
        return response;
    }

    public static <T> ApiResponse<T> error(int statusCode, String message) {
        ApiResponse<T> response = new ApiResponse<>();
        response.setSuccess(false);
        response.setStatusCode(statusCode);
        response.setMessage(message);
        response.setTimestamp(LocalDateTime.now().toString());
        return response;
    }

    public boolean isSuccess() {
        return success;
    }

    public void setSuccess(boolean success) {
        this.success = success;
    }

    public int getStatusCode() {
        return statusCode;
    }

    public void setStatusCode(int statusCode) {
        this.statusCode = statusCode;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public T getData() {
        return data;
    }

    public void setData(T data) {
        this.data = data;
    }

    public Long getTotal() {
        return total;
    }

    public void setTotal(Long total) {
        this.total = total;
    }

    public List<String> getErrors() {
        return errors;
    }

    public void setErrors(List<String> errors) {
        this.errors = errors;
    }

    public String getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(String timestamp) {
        this.timestamp = timestamp;
    }
}
