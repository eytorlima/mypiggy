package com.mypiggy.service;

import com.mypiggy.dto.UserSettingsRequestDTO;
import com.mypiggy.dto.UserSettingsResponseDTO;
import com.mypiggy.model.User;
import com.mypiggy.model.UserSettings;
import com.mypiggy.repository.UserSettingsRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class UserSettingsService {

    private final UserSettingsRepository userSettingsRepository;

    // Cria as configurações padrão (BRL, pt-BR, Brasília, notificações ligadas).
    // Participa da transação do cadastro: se algo falhar, o usuário também não é salvo.
    // Se já existirem, devolve as existentes (evita violar o UNIQUE de user_id).
    @Transactional
    public UserSettings createDefaultFor(User user) {
        return userSettingsRepository.findByUserId(user.getId())
            .orElseGet(() -> {
                UserSettings settings = new UserSettings();
                settings.setUser(user);
                return userSettingsRepository.save(settings);
            });
    }

    // Se o usuário por algum motivo não tiver configurações, cria as padrão em vez de dar 404.
    // Não é readOnly porque pode gravar.
    @Transactional
    public UserSettingsResponseDTO getSettings(User user) {
        return toResponse(createDefaultFor(user));
    }

    // Só notificationEnabled é editável; os demais campos são fixos no banco (CHECK)
    @Transactional
    public UserSettingsResponseDTO update(User user, UserSettingsRequestDTO request) {
        UserSettings settings = createDefaultFor(user);
        settings.setNotificationEnabled(request.getNotificationEnabled());
        return toResponse(userSettingsRepository.save(settings));
    }

    private UserSettingsResponseDTO toResponse(UserSettings settings) {
        return new UserSettingsResponseDTO(
            settings.getCurrency(),
            settings.getLanguage(),
            settings.getTimeZone(),
            settings.isNotificationEnabled()
        );
    }
}