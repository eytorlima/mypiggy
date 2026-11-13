package com.mypiggy.service;

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
}