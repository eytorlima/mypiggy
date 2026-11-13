package com.mypiggy.dto;

public record UserSettingsResponseDTO(
    String currency,
    String language,
    String timeZone,
    boolean notificationEnabled
) {}