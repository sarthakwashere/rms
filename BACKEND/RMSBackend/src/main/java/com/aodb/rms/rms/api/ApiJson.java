package com.aodb.rms.rms.api;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.springframework.stereotype.Component;

@Component
public class ApiJson {
    private final ObjectMapper mapper;

    public ApiJson(ObjectMapper mapper) {
        this.mapper = mapper;
    }

    public ObjectMapper mapper() {
        return mapper;
    }

    public ObjectNode obj() {
        return mapper.createObjectNode();
    }

    public ArrayNode arr() {
        return mapper.createArrayNode();
    }

    public JsonNode parseOrEmptyObject(JsonNode node) {
        return node == null ? obj() : node;
    }

    /** Convert POJOs / Maps / Lists from request DTOs into JSON columns. */
    public JsonNode valueToTree(Object value) {
        if (value == null) {
            return obj();
        }
        return mapper.valueToTree(value);
    }
}

