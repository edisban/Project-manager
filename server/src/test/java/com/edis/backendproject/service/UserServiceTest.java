package com.edis.backendproject.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.Optional;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import com.edis.backendproject.dto.RegisterRequest;
import com.edis.backendproject.exception.AppExceptions.ConflictException;
import com.edis.backendproject.exception.AppExceptions.ForbiddenOperationException;
import com.edis.backendproject.model.Role;
import com.edis.backendproject.model.User;
import com.edis.backendproject.repository.UserRepository;
import com.edis.backendproject.security.AppUserPrincipal;

@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @InjectMocks
    private UserService userService;

    @Test
    void registerStoresHashedPasswordAndUserRole() {
        when(userRepository.existsByUsernameIgnoreCase("alice")).thenReturn(false);
        when(passwordEncoder.encode("supersecret")).thenReturn("hashed");
        when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

        User user = userService.register(new RegisterRequest(" alice ", "supersecret"));

        assertThat(user.getUsername()).isEqualTo("alice");
        assertThat(user.getPassword()).isEqualTo("hashed");
        assertThat(user.getRole()).isEqualTo(Role.USER);
    }

    @Test
    void registerRejectsTakenUsername() {
        when(userRepository.existsByUsernameIgnoreCase("alice")).thenReturn(true);

        assertThatThrownBy(() -> userService.register(new RegisterRequest("alice", "supersecret")))
                .isInstanceOf(ConflictException.class);
        verify(userRepository, never()).save(any());
    }

    @Test
    void adminCannotDeleteOwnAccount() {
        AppUserPrincipal admin = new AppUserPrincipal(1L, "admin", "x", Role.ADMIN);

        assertThatThrownBy(() -> userService.deleteOwnAccount(admin))
                .isInstanceOf(ForbiddenOperationException.class);
        verify(userRepository, never()).delete(any());
    }

    @Test
    void userCanDeleteOwnAccount() {
        User user = User.builder().id(3L).username("bob").build();
        when(userRepository.findById(3L)).thenReturn(Optional.of(user));

        userService.deleteOwnAccount(new AppUserPrincipal(3L, "bob", "x", Role.USER));

        verify(userRepository).delete(user);
    }
}
