package com.edis.backendproject.service;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.edis.backendproject.dto.RegisterRequest;
import com.edis.backendproject.exception.AppExceptions.ConflictException;
import com.edis.backendproject.exception.AppExceptions.ForbiddenOperationException;
import com.edis.backendproject.exception.AppExceptions.ResourceNotFoundException;
import com.edis.backendproject.model.Role;
import com.edis.backendproject.model.User;
import com.edis.backendproject.repository.UserRepository;
import com.edis.backendproject.security.AppUserPrincipal;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    /**
     * Registers a new {@link Role#USER}. Usernames are unique case-insensitively.
     *
     * @throws ConflictException when the username is already taken
     */
    @Transactional
    public User register(RegisterRequest request) {
        String username = request.username().trim();
        if (userRepository.existsByUsernameIgnoreCase(username)) {
            throw new ConflictException("This username is already taken");
        }
        User user = User.builder()
                .username(username)
                .password(passwordEncoder.encode(request.password()))
                .role(Role.USER)
                .build();
        return userRepository.save(user);
    }

    /**
     * Deletes the caller's account together with their projects and students (database cascade).
     * The administrator account cannot delete itself.
     */
    @Transactional
    public void deleteOwnAccount(AppUserPrincipal currentUser) {
        if (currentUser.isAdmin()) {
            throw new ForbiddenOperationException("The administrator account can't be deleted");
        }
        User user = userRepository.findById(currentUser.getId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        userRepository.delete(user);
    }
}
