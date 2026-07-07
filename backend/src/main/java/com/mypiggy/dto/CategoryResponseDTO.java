package com.mypiggy.dto;

import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class CategoryResponseDTO {

    private Integer id;
    private String name;
    private String description;
    private String color;
    private String icon;
    private Boolean isDefault;
}