package com.fuxiangtui.service.impl;

import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.fuxiangtui.entity.SysParameter;
import com.fuxiangtui.mapper.SysParameterMapper;
import com.fuxiangtui.service.SysParameterService;
import org.springframework.stereotype.Service;

@Service
public class SysParameterServiceImpl extends ServiceImpl<SysParameterMapper, SysParameter> implements SysParameterService {}
