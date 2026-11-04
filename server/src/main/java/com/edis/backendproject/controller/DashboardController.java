package com.edis.backendproject.controller;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.edis.backendproject.dto.ApiResponse;
import com.edis.backendproject.dto.DashboardResponse;
import com.edis.backendproject.security.AppUserPrincipal;
import com.edis.backendproject.service.DashboardService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final DashboardService dashboardService;

    @GetMapping
    public ApiResponse<DashboardResponse> overview(@AuthenticationPrincipal AppUserPrincipal user) {
        return ApiResponse.success(dashboardService.overview(user));
    }
}
